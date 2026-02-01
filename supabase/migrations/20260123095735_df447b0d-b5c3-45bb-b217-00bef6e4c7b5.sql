-- Create weekly_challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can view weekly challenges
CREATE POLICY "Anyone can view weekly challenges"
ON public.weekly_challenges
FOR SELECT
USING (true);

-- Create user_weekly_progress table
CREATE TABLE public.user_weekly_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id, week_start)
);

-- Enable RLS
ALTER TABLE public.user_weekly_progress ENABLE ROW LEVEL SECURITY;

-- Users can view own weekly progress
CREATE POLICY "Users can view own weekly progress"
ON public.user_weekly_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own weekly progress
CREATE POLICY "Users can insert own weekly progress"
ON public.user_weekly_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own weekly progress
CREATE POLICY "Users can update own weekly progress"
ON public.user_weekly_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default weekly challenges
INSERT INTO public.weekly_challenges (name, description, challenge_type, target_value, xp_reward) VALUES
('Marathon Studier', 'Complete 20 Pomodoro sessions this week', 'pomodoros', 20, 250),
('Dedication Master', 'Study for 10 hours total this week', 'study_time', 600, 300),
('Social Learner', 'Join 5 different study rooms this week', 'rooms_joined', 5, 150),
('Streak Champion', 'Maintain a 5-day study streak', 'streak_days', 5, 200),
('Focus Legend', 'Complete 3 daily challenges in one week', 'daily_challenges', 3, 175);