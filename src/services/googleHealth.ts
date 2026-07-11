import { supabase } from '../lib/supabase';

// Must exactly match an "Authorized redirect URI" configured on the Google
// OAuth client in Cloud Console, and must be the same string used for both
// the 'start' and 'callback' Edge Function calls.
export function redirectUri(): string {
  return `${window.location.origin}/dashboard/devices`;
}

async function callFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-health`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json as T;
}

// Kicks off the OAuth flow by redirecting the browser to Google's consent screen.
export async function startGoogleHealthConnect(): Promise<void> {
  const { url } = await callFunction<{ url: string }>({ action: 'start', redirectUri: redirectUri() });
  window.location.href = url;
}

// Called once, after Google redirects back with ?code=... in the URL.
export async function completeGoogleHealthConnect(code: string): Promise<void> {
  await callFunction({ action: 'callback', code, redirectUri: redirectUri() });
}

export async function syncGoogleHealth(): Promise<void> {
  await callFunction({ action: 'sync' });
}

export async function disconnectGoogleHealth(): Promise<void> {
  await callFunction({ action: 'disconnect' });
}
