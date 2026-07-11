import { supabase } from '../lib/supabase';
import { generateDemoMetrics } from '../lib/demoData';

export type ProviderId = 'demo' | 'fitbit' | 'withings' | 'google_health';

export interface WearableProviderInfo {
  id: ProviderId;
  name: string;
  description: string;
  metrics: string[];
  // 'ready' connects right now; 'needs-setup' requires developer-app
  // registration + a server-side token exchange before it can go live.
  availability: 'ready' | 'needs-setup';
  setupSteps?: string[];
}

export const PROVIDERS: WearableProviderInfo[] = [
  {
    id: 'demo',
    name: 'Demo Data',
    description: 'Realistic sample data so you can explore every wearable-powered feature today.',
    metrics: ['Steps', 'Distance', 'Sleep', 'Heart rate', 'Calories', 'Body composition', 'Blood pressure'],
    availability: 'ready',
  },
  {
    id: 'google_health',
    name: 'Fitbit (via Google Health)',
    description:
      'Steps, heart rate, sleep, and activity from Fitbit devices — synced through the new Google Health API, which is replacing the legacy Fitbit Web API in September 2026.',
    metrics: ['Steps', 'Sleep', 'Heart rate', 'Activity'],
    availability: 'ready',
  },
  {
    id: 'withings',
    name: 'Withings',
    description: 'Smart-scale weight, body composition, blood pressure, and sleep from Withings devices.',
    metrics: ['Weight', 'Body fat', 'Muscle mass', 'Blood pressure', 'Sleep'],
    availability: 'needs-setup',
    setupSteps: [
      'Register at developer.withings.com and create an OAuth application',
      'Add WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET to Supabase Edge Function secrets',
      'Deploy the token-exchange Edge Function, then this card becomes connectable',
    ],
  },
];

// Demo provider: seeds deterministic metrics into health_metrics.
export async function connectDemo(userId: string): Promise<void> {
  const metrics = generateDemoMetrics(userId).map((m) => ({ ...m, user_id: userId, source: 'demo' }));

  // chunk upserts to stay under request-size limits
  for (let i = 0; i < metrics.length; i += 200) {
    const { error } = await supabase
      .from('health_metrics')
      .upsert(metrics.slice(i, i + 200), { onConflict: 'user_id,log_date,metric_type,source' });
    if (error) throw error;
  }

  const { error } = await supabase.from('device_connections').upsert(
    {
      user_id: userId,
      provider: 'demo',
      status: 'connected',
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );
  if (error) throw error;
}

export async function syncDemo(userId: string): Promise<void> {
  // regenerate the most recent week (deterministic, so this is idempotent)
  const metrics = generateDemoMetrics(userId, 7).map((m) => ({ ...m, user_id: userId, source: 'demo' }));
  const { error } = await supabase
    .from('health_metrics')
    .upsert(metrics, { onConflict: 'user_id,log_date,metric_type,source' });
  if (error) throw error;

  const { error: connError } = await supabase
    .from('device_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'demo');
  if (connError) throw connError;
}

export async function disconnectDemo(userId: string): Promise<void> {
  // remove demo metrics so dashboards honestly reflect "no device connected"
  const { error: metricsError } = await supabase
    .from('health_metrics')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'demo');
  if (metricsError) throw metricsError;

  const { error } = await supabase
    .from('device_connections')
    .update({ status: 'disconnected' })
    .eq('user_id', userId)
    .eq('provider', 'demo');
  if (error) throw error;
}
