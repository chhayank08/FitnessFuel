-- Server-side OAuth token storage for the Google Health provider. Tokens are
-- never sent to the client — only Edge Functions (service role) read/write
-- this table. RLS still restricts by user_id as defense in depth, but the
-- anon/authenticated roles are granted no policies here at all: only the
-- service role (which bypasses RLS) touches this table.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_health', 'fitbit', 'withings')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies for anon/authenticated: this table is only ever
-- read or written by Edge Functions running with the service role key,
-- which bypasses RLS entirely. No client-side Supabase call should ever
-- target this table.

-- device_connections already supports provider values via a CHECK constraint
-- that only allowed 'fitbit' | 'withings' | 'demo'. Widen it for the new
-- 'google_health' provider id used going forward for Fitbit-via-Google data.
ALTER TABLE device_connections DROP CONSTRAINT IF EXISTS device_connections_provider_check;
ALTER TABLE device_connections ADD CONSTRAINT device_connections_provider_check
  CHECK (provider IN ('fitbit', 'withings', 'demo', 'google_health'));
