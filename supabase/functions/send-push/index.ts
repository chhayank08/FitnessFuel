// Sends Web Push notifications to a user's registered devices.
// Deploy with:
//   supabase functions deploy send-push
// Secrets (never in .env / VITE_*):
//   supabase secrets set VAPID_PRIVATE_KEY_JWK='{"alg":"ES256","key_ops":["sign"],"ext":true,"kty":"EC","x":"...","y":"...","crv":"P-256","d":"..."}' VAPID_ADMIN_CONTACT='mailto:you@example.com'
//   (generate a matching pair with `npx @pushforge/builder vapid` — the JWK
//   private key format here is NOT the same as `web-push generate-vapid-keys`.
//   The public half goes in VITE_VAPID_PUBLIC_KEY in .env, client-exposed by
//   design.)
//
// Uses @pushforge/builder instead of the `web-push` npm package: web-push
// depends on Node-only APIs (https.request, crypto.createECDH) that don't
// work in Deno Deploy's edge runtime; pushforge is zero-dependency and built
// on the standard Web Crypto API, which Deno implements natively.
//
// Actions (POST { action, ... } with the user's Supabase JWT in Authorization):
//   'send-test' -> sends a test push to every subscription belonging to the calling user

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { buildPushHTTPRequest } from 'npm:@pushforge/builder@2';

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

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

async function sendToSubscription(
  sub: PushSubscriptionRow,
  payload: PushPayload,
  privateJWK: JsonWebKey,
  adminContact: string
): Promise<{ ok: boolean; status?: number; stale?: boolean }> {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK,
    subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    message: {
      payload: { title: payload.title, body: payload.body, url: payload.url, tag: payload.tag },
      adminContact,
      options: { ttl: 3600, urgency: 'high' },
    },
  });
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  // 404/410 mean the subscription is gone (uninstalled, expired) — caller
  // should delete the row rather than retry.
  return { ok: res.ok, status: res.status, stale: res.status === 404 || res.status === 410 };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  const privateJWKRaw = Deno.env.get('VAPID_PRIVATE_KEY_JWK');
  const adminContact = Deno.env.get('VAPID_ADMIN_CONTACT');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!privateJWKRaw || !adminContact) {
    return json({ error: 'Web Push is not configured on the server yet.' }, 500, origin);
  }
  let privateJWK: JsonWebKey;
  try {
    privateJWK = JSON.parse(privateJWKRaw);
  } catch {
    return json({ error: 'VAPID_PRIVATE_KEY_JWK is not valid JSON.' }, 500, origin);
  }

  // Verify the caller via their Supabase JWT; admin client below is used
  // only to read the caller's OWN subscriptions (still scoped by user_id,
  // even though the service role bypasses RLS) and to clean up stale rows.
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
    if (action === 'send-test') {
      const { data: subs, error } = await admin
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', userId);
      if (error) return json({ error: 'Could not load subscriptions' }, 500, origin);
      if (!subs || subs.length === 0) return json({ error: 'No push subscriptions found for this account' }, 400, origin);

      const payload: PushPayload = {
        title: 'FitnessFuel',
        body: 'Push notifications are working! 🎉',
        url: '/dashboard',
        tag: 'test',
      };

      const results = await Promise.all(
        (subs as PushSubscriptionRow[]).map(async (sub) => {
          const result = await sendToSubscription(sub, payload, privateJWK, adminContact);
          if (result.stale) await admin.from('push_subscriptions').delete().eq('id', sub.id);
          return { id: sub.id, ...result };
        })
      );

      const sent = results.filter((r) => r.ok).length;
      return json({ ok: sent > 0, sent, total: results.length, results }, 200, origin);
    }

    return json({ error: `Unknown action: ${action}` }, 400, origin);
  } catch (e) {
    console.error('send-push function error:', e);
    return json({ error: 'Internal error' }, 500, origin);
  }
});
