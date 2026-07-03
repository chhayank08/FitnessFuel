-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  weight NUMERIC,
  height NUMERIC,
  age INTEGER,
  gender TEXT,
  goal TEXT,
  weekly_weight_change DECIMAL(3,1) DEFAULT 0
);

-- diet_plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC
);

-- exercise_plans
CREATE TABLE IF NOT EXISTS exercise_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration NUMERIC,
  difficulty TEXT
);

-- progress_logs
CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight NUMERIC,
  notes TEXT,
  mood TEXT
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- diet_plans policies
CREATE POLICY "Users can view their own diet plans" ON diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own diet plans" ON diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diet plans" ON diet_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diet plans" ON diet_plans FOR DELETE USING (auth.uid() = user_id);

-- exercise_plans policies
CREATE POLICY "Users can view their own exercise plans" ON exercise_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own exercise plans" ON exercise_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercise plans" ON exercise_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercise plans" ON exercise_plans FOR DELETE USING (auth.uid() = user_id);

-- progress_logs policies
CREATE POLICY "Users can view their own progress logs" ON progress_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress logs" ON progress_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress logs" ON progress_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress logs" ON progress_logs FOR DELETE USING (auth.uid() = user_id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
