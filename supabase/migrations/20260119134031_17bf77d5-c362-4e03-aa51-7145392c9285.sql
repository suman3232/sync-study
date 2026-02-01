-- Create daily challenges table
CREATE TABLE public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL, -- 'pomodoros', 'study_time', 'rooms_joined'
  target_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can view challenges
CREATE POLICY "Anyone can view daily challenges" 
ON public.daily_challenges 
FOR SELECT 
USING (true);

-- Create user daily challenge progress table
CREATE TABLE public.user_daily_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;

-- Users can view own progress
CREATE POLICY "Users can view own daily progress" 
ON public.user_daily_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert own progress
CREATE POLICY "Users can insert own daily progress" 
ON public.user_daily_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own progress
CREATE POLICY "Users can update own daily progress" 
ON public.user_daily_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default daily challenges
INSERT INTO public.daily_challenges (name, description, challenge_type, target_value, xp_reward) VALUES
('Focus Starter', 'Complete 1 Pomodoro session', 'pomodoros', 1, 25),
('Focused Mind', 'Complete 3 Pomodoro sessions', 'pomodoros', 3, 75),
('Study Marathon', 'Study for 60 minutes total', 'study_time', 60, 100),
('Social Learner', 'Join 2 different study rooms', 'rooms_joined', 2, 50),
('Deep Work', 'Complete 5 Pomodoro sessions', 'pomodoros', 5, 150);