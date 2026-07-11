// Google Health API OAuth + sync, running server-side so the client secret
// never reaches the browser. Deploy with:
//   supabase functions deploy google-health
// Secrets (never in .env / VITE_*):
//   supabase secrets set GOOGLE_HEALTH_CLIENT_ID=... GOOGLE_HEALTH_CLIENT_SECRET=...
//
// Actions (POST { action, ... } with the user's Supabase JWT in Authorization):
//   'start'    -> returns the Google consent URL for the client to redirect to
//   'callback' -> exchanges the ?code= from Google for tokens, stores them, seeds health_metrics
//   'sync'     -> refreshes the access token if needed and pulls the latest data
//   'disconnect' -> revokes locally (deletes stored tokens + connection row)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const HEALTH_API_BASE = 'https://health.googleapis.com/v4';

const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
].join(' ');

// Google Health dataType -> our health_metrics.metric_type, plus the field
// path to read the numeric value out of each rollup's JSON shape.
const DATA_TYPES: { googleType: string; metricType: string }[] = [
  { googleType: 'steps', metricType: 'steps' },
  { googleType: 'heart_rate', metricType: 'heart_rate_avg' },
  { googleType: 'sleep', metricType: 'sleep_minutes' },
  { googleType: 'weight', metricType: 'body_fat_pct' }, // placeholder mapping until response shape is confirmed against a live account
];

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  const clientId = Deno.env.get('GOOGLE_HEALTH_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_HEALTH_CLIENT_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!clientId || !clientSecret) {
    return json({ error: 'Google Health OAuth is not configured on the server yet.' }, 500, origin);
  }

  // Verify the caller via their Supabase JWT (the anon-key client sends this
  // in Authorization: Bearer <jwt>); admin client below uses the service
  // role to read/write oauth_tokens, which has no client-facing RLS policy.
  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not authenticated' }, 401, origin);
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine for actions that don't need one
  }
  const action = body.action as string;

  try {
    if (action === 'start') {
      const redirectUri = body.redirectUri as string;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: userId,
      });
      return json({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` }, 200, origin);
    }

    if (action === 'callback') {
      const code = body.code as string;
      const redirectUri = body.redirectUri as string;

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok) return json({ error: tokens.error_description || 'Token exchange failed' }, 400, origin);

      const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
      await admin.from('oauth_tokens').upsert(
        {
          user_id: userId,
          provider: 'google_health',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: expiresAt,
          scope: tokens.scope ?? SCOPES,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

      await admin.from('device_connections').upsert(
        {
          user_id: userId,
          provider: 'google_health',
          status: 'connected',
          connected_at: new Date().toISOString(),
          last_sync_at: null,
        },
        { onConflict: 'user_id,provider' }
      );

      return json({ ok: true }, 200, origin);
    }

    if (action === 'sync') {
      const accessToken = await getValidAccessToken(admin, userId, clientId, clientSecret);
      if (!accessToken) return json({ error: 'Not connected to Google Health' }, 400, origin);

      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      let syncedAny = false;

      for (const { googleType, metricType } of DATA_TYPES) {
        const url = `${HEALTH_API_BASE}/users/me/dataTypes/${googleType}/dataPoints?filter=${encodeURIComponent(
          `${googleType}.interval.start_time >= "${since}"`
        )}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) continue; // this data type may not be granted/available for the user; skip, don't fail the whole sync
        const data = await res.json();
        const points = (data.dataPoints || []) as Array<Record<string, unknown>>;

        const rows = points
          .map((p) => normalizeDataPoint(p, metricType))
          .filter((r): r is NonNullable<typeof r> => r != null)
          .map((r) => ({ ...r, user_id: userId, source: 'fitbit' as const }));

        if (rows.length > 0) {
          await admin.from('health_metrics').upsert(rows, { onConflict: 'user_id,log_date,metric_type,source' });
          syncedAny = true;
        }
      }

      await admin
        .from('device_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', 'google_health');

      return json({ ok: true, syncedAny }, 200, origin);
    }

    if (action === 'disconnect') {
      await admin.from('oauth_tokens').delete().eq('user_id', userId).eq('provider', 'google_health');
      await admin
        .from('device_connections')
        .update({ status: 'disconnected' })
        .eq('user_id', userId)
        .eq('provider', 'google_health');
      await admin.from('health_metrics').delete().eq('user_id', userId).eq('source', 'fitbit');
      return json({ ok: true }, 200, origin);
    }

    return json({ error: `Unknown action: ${action}` }, 400, origin);
  } catch (e) {
    console.error('google-health function error:', e);
    return json({ error: 'Internal error' }, 500, origin);
  }
});

async function getValidAccessToken(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const { data: row } = await admin
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_health')
    .maybeSingle();
  if (!row) return null;

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) return row.access_token;
  if (!row.refresh_token) return row.access_token; // best effort; will 401 upstream if truly expired

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) return null;
  const refreshed = await res.json();
  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();

  await admin
    .from('oauth_tokens')
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'google_health');

  return refreshed.access_token;
}

// Google Health dataPoint responses use typed rollup value objects whose
// exact field names vary by dataType (StepsRollupValue, HeartRateRollupValue,
// etc). This reads the common shape defensively and falls back to skipping
// a point rather than guessing wrong. Field names should be confirmed
// against a real connected account and adjusted here once verified.
function normalizeDataPoint(
  point: Record<string, unknown>,
  metricType: string
): { log_date: string; metric_type: string; value: number; recorded_at: string } | null {
  const interval = point.interval as { startTime?: string; civilStartTime?: string } | undefined;
  const startTime = interval?.startTime || interval?.civilStartTime;
  if (!startTime) return null;

  const value = extractNumericValue(point);
  if (value == null) return null;

  return {
    log_date: startTime.slice(0, 10),
    metric_type: metricType,
    value,
    recorded_at: new Date(startTime).toISOString(),
  };
}

function extractNumericValue(point: Record<string, unknown>): number | null {
  for (const key of Object.keys(point)) {
    const v = point[key];
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object') {
      for (const nestedKey of ['value', 'count', 'quantity', 'bpm', 'minutes']) {
        const nested = (v as Record<string, unknown>)[nestedKey];
        if (typeof nested === 'number') return nested;
      }
    }
  }
  return null;
}
