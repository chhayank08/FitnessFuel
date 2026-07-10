-- daily_logs: one row per user per day (water + manual macro extras)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INTEGER NOT NULL DEFAULT 0,
  extra_calories INTEGER NOT NULL DEFAULT 0,
  extra_protein INTEGER NOT NULL DEFAULT 0,
  extra_carbs INTEGER NOT NULL DEFAULT 0,
  extra_fat INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- plan_completions: checked-off plan items and quick-added meals,
-- with a macro snapshot taken at completion time (plans regenerate)
CREATE TABLE IF NOT EXISTS plan_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_type TEXT NOT NULL CHECK (item_type IN ('meal', 'workout')),
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, log_date, item_type, item_key)
);

CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS plan_completions_user_date_idx ON plan_completions (user_id, log_date DESC);

-- profile columns needed by nutrition targets and goal projection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,1);

-- RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

-- daily_logs policies
CREATE POLICY "Users can view their own daily logs" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily logs" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily logs" ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily logs" ON daily_logs FOR DELETE USING (auth.uid() = user_id);

-- plan_completions policies
CREATE POLICY "Users can view their own plan completions" ON plan_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plan completions" ON plan_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan completions" ON plan_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plan completions" ON plan_completions FOR DELETE USING (auth.uid() = user_id);
