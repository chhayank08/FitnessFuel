-- health_metrics: daily wearable/manual metrics (demo provider now, Fitbit/Withings later)
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'steps', 'heart_rate_avg', 'heart_rate_resting', 'sleep_minutes',
    'calories_burned', 'distance_m', 'body_fat_pct', 'muscle_mass_kg',
    'bp_systolic', 'bp_diastolic'
  )),
  value NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo' CHECK (source IN ('demo', 'fitbit', 'withings', 'manual')),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, log_date, metric_type, source)
);

-- device_connections: wearable provider link status (tokens live server-side later)
CREATE TABLE IF NOT EXISTS device_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('fitbit', 'withings', 'demo')),
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  UNIQUE (user_id, provider)
);

-- workout_sessions: Form Coach session reports
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_key TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  avg_form_score NUMERIC,
  rep_scores JSONB DEFAULT '[]',
  feedback JSONB DEFAULT '[]'
);

-- saved_foods: user's favorite foods from Open Food Facts / USDA / manual entry
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_desc TEXT,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  micronutrients JSONB DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('off', 'usda', 'manual'))
);

-- user_settings: persisted app preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_metrics_user_date_idx ON health_metrics (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS workout_sessions_user_idx ON workout_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS saved_foods_user_idx ON saved_foods (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS saved_foods_user_barcode_idx
  ON saved_foods (user_id, barcode) WHERE barcode IS NOT NULL;

-- RLS
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- health_metrics policies
CREATE POLICY "Users can view their own health metrics" ON health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own health metrics" ON health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own health metrics" ON health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own health metrics" ON health_metrics FOR DELETE USING (auth.uid() = user_id);

-- device_connections policies
CREATE POLICY "Users can view their own device connections" ON device_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own device connections" ON device_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own device connections" ON device_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own device connections" ON device_connections FOR DELETE USING (auth.uid() = user_id);

-- workout_sessions policies
CREATE POLICY "Users can view their own workout sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- saved_foods policies
CREATE POLICY "Users can view their own saved foods" ON saved_foods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved foods" ON saved_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved foods" ON saved_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved foods" ON saved_foods FOR DELETE USING (auth.uid() = user_id);

-- user_settings policies
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);
