-- Unify workout logging: every workout (Form Coach, Quick Workout, plan-driven
-- player) writes workout_sessions, and streak/analytics read it alongside
-- plan_completions.
--
-- source contract: sessions with source = 'plan' are ALSO mirrored into
-- plan_completions by the client, so analytics count workouts as
-- plan_completions + sessions WHERE source != 'plan' (no double counting).

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'coach'
    CHECK (source IN ('coach', 'quick', 'plan')),
  ADD COLUMN IF NOT EXISTS calories NUMERIC,
  ADD COLUMN IF NOT EXISTS exercises JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS log_date DATE;

-- Backfill: existing rows are Form Coach sessions; date them from started_at.
UPDATE workout_sessions SET log_date = (started_at)::date WHERE log_date IS NULL;

ALTER TABLE workout_sessions
  ALTER COLUMN log_date SET NOT NULL,
  ALTER COLUMN log_date SET DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS workout_sessions_user_logdate_idx
  ON workout_sessions (user_id, log_date DESC);
