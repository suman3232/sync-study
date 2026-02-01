-- Create achievements table for defining available achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table for tracking earned achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone (they're just definitions)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- Users can view their own earned achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can earn achievements
CREATE POLICY "Users can earn achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert predefined achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
-- Pomodoro achievements
('First Focus', 'Complete your first Pomodoro session', 'timer', 'pomodoro', 'pomodoro_count', 1, 50),
('Getting Started', 'Complete 10 Pomodoro sessions', 'zap', 'pomodoro', 'pomodoro_count', 10, 100),
('Focus Master', 'Complete 50 Pomodoro sessions', 'target', 'pomodoro', 'pomodoro_count', 50, 250),
('Pomodoro Pro', 'Complete 100 Pomodoro sessions', 'award', 'pomodoro', 'pomodoro_count', 100, 500),
('Focus Legend', 'Complete 500 Pomodoro sessions', 'crown', 'pomodoro', 'pomodoro_count', 500, 1000),

-- Study time achievements
('Study Starter', 'Study for 1 hour total', 'clock', 'study_time', 'total_study_time', 60, 50),
('Dedicated Learner', 'Study for 10 hours total', 'book-open', 'study_time', 'total_study_time', 600, 200),
('Knowledge Seeker', 'Study for 50 hours total', 'graduation-cap', 'study_time', 'total_study_time', 3000, 500),
('Study Champion', 'Study for 100 hours total', 'trophy', 'study_time', 'total_study_time', 6000, 1000),

-- Streak achievements
('Consistency', 'Maintain a 3-day study streak', 'flame', 'streak', 'current_streak', 3, 100),
('Week Warrior', 'Maintain a 7-day study streak', 'calendar', 'streak', 'current_streak', 7, 250),
('Two Week Champion', 'Maintain a 14-day study streak', 'star', 'streak', 'current_streak', 14, 500),
('Month Master', 'Maintain a 30-day study streak', 'medal', 'streak', 'current_streak', 30, 1000),
('Unstoppable', 'Maintain a 100-day study streak', 'rocket', 'streak', 'longest_streak', 100, 2500);