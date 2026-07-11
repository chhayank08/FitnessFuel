# Google Health API integration — setup

## 1. Configure the OAuth client in Google Cloud Console

You already created a client (see your Google Cloud Console for the Client ID). Open it in
**APIs & Services → Credentials** and set:

- **Authorized redirect URIs**: add both
  - `http://localhost:5173/dashboard/devices` (and `5174` if that's what your dev server uses)
  - `https://<your-production-domain>/dashboard/devices`

The redirect URI must match exactly what the app sends — it's built from
`window.location.origin` + `/dashboard/devices` in `src/services/googleHealth.ts`.

## 2. Add yourself as a test user

Go to **APIs & Services → OAuth consent screen → Audience → Test users** and
add your own Google account email. Unverified apps are capped at 100 test
users and can only be used by accounts on this list — this is expected and
fine for development. Going beyond 100 users requires Google's CASA security
review (paid, third-party) — not needed until you're ready to launch this
publicly.

## 3. Rotate your client secret

If a client secret for this app was ever pasted in plaintext anywhere
(chat, docs, commits), treat it as compromised. In Cloud Console, go to
the same OAuth client and click **Reset secret** to generate a new one.
Use the new value below.

## 4. Set the Edge Function secrets

Never put these in `.env` — `VITE_`-prefixed vars ship to every visitor's
browser, and these are not `VITE_`-prefixed for exactly that reason.

```bash
supabase link --project-ref deqhrqngpxhzocvsfjmq
supabase secrets set GOOGLE_HEALTH_CLIENT_ID=<your OAuth client ID>.apps.googleusercontent.com
supabase secrets set GOOGLE_HEALTH_CLIENT_SECRET=<the new rotated secret>
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided automatically to every Edge Function — you don't set those.

## 5. Deploy the function

```bash
supabase functions deploy google-health
```

## 6. Apply the two pending migrations (if not already applied)

Paste these into the Supabase SQL editor, in order:
- `supabase/migrations/20260711000000_health_platform.sql`
- `supabase/migrations/20260712000000_google_health_oauth.sql`

## 7. Test it

1. `npm run dev`, sign in, go to **Devices**.
2. Click **Connect** on "Fitbit (via Google Health)".
3. You'll be sent to Google's consent screen — sign in with the Google
   account you added as a test user, and accept.
4. You're redirected back to `/dashboard/devices`; the app exchanges the
   `?code=` for tokens (server-side, via the Edge Function) and does an
   initial sync.

## Known limitation to verify

The exact JSON field names Google Health returns per data point
(`interval.startTime`, the nested value field for steps vs. heart rate vs.
sleep, etc.) were not confirmed against a live connected account while
building this — Google's public docs don't fully spell out the response
schema. `normalizeDataPoint()` and `extractNumericValue()` in `index.ts`
read the response defensively and skip anything they can't parse rather
than guessing wrong, so nothing crashes — but the values may not populate
correctly until you connect a real Fitbit-linked Google account and I (or
you) check the actual response shape in the Edge Function logs
(`supabase functions logs google-health`) and adjust the field mapping.
