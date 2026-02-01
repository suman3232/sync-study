-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  study_goal TEXT,
  total_study_time INTEGER DEFAULT 0, -- in minutes
  pomodoro_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create study_rooms table
CREATE TABLE public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  timer_duration INTEGER DEFAULT 25, -- in minutes
  break_duration INTEGER DEFAULT 5, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room_members table
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'idle' CHECK (status IN ('studying', 'break', 'idle')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- Create room_timer_state table for synced timers
CREATE TABLE public.room_timer_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  is_running BOOLEAN DEFAULT false,
  is_break BOOLEAN DEFAULT false,
  time_remaining INTEGER DEFAULT 1500, -- in seconds (25 min)
  started_at TIMESTAMP WITH TIME ZONE,
  last_action_by UUID REFERENCES auth.users(id),
  last_action TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room_notes table for shared notes
CREATE TABLE public.room_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  last_edited_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room_messages table for chat
CREATE TABLE public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create study_sessions table for tracking
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL, -- in minutes
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_timer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Study rooms policies
CREATE POLICY "Authenticated users can view rooms" ON public.study_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create rooms" ON public.study_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Room creators can update rooms" ON public.study_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Room creators can delete rooms" ON public.study_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Room members policies
CREATE POLICY "Members can view room members" ON public.room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Room timer state policies
CREATE POLICY "Members can view timer state" ON public.room_timer_state FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_timer_state.room_id AND user_id = auth.uid())
);
CREATE POLICY "Members can update timer state" ON public.room_timer_state FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_timer_state.room_id AND user_id = auth.uid())
);
CREATE POLICY "Room creators can insert timer state" ON public.room_timer_state FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_rooms WHERE id = room_id AND created_by = auth.uid())
);

-- Room notes policies
CREATE POLICY "Members can view notes" ON public.room_notes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_notes.room_id AND user_id = auth.uid())
);
CREATE POLICY "Members can update notes" ON public.room_notes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_notes.room_id AND user_id = auth.uid())
);
CREATE POLICY "Room creators can insert notes" ON public.room_notes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_rooms WHERE id = room_id AND created_by = auth.uid())
);

-- Room messages policies
CREATE POLICY "Members can view messages" ON public.room_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid())
);

-- Study sessions policies
CREATE POLICY "Users can view own sessions" ON public.study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate room codes
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_rooms_updated_at BEFORE UPDATE ON public.study_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_timer_state_updated_at BEFORE UPDATE ON public.room_timer_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_notes_updated_at BEFORE UPDATE ON public.room_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for necessary tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_timer_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;