import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  study_goal: string | null;
  total_study_time: number;
  pomodoro_count: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useCompletePomodoro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, duration }: { roomId: string; duration: number }) => {
      if (!user) throw new Error('No user');

      // Get current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const today = new Date().toISOString().split('T')[0];
      const lastStudyDate = profile.last_study_date;
      
      let newStreak = profile.current_streak || 0;
      
      if (lastStudyDate) {
        const lastDate = new Date(lastStudyDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day, streak stays the same
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak += 1;
        } else {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      } else {
        // First study session ever
        newStreak = 1;
      }

      const longestStreak = Math.max(profile.longest_streak || 0, newStreak);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          pomodoro_count: (profile.pomodoro_count || 0) + 1,
          total_study_time: (profile.total_study_time || 0) + duration,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_study_date: today,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log study session
      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          room_id: roomId,
          duration,
        });

      if (sessionError) throw sessionError;

      return { newStreak, longestStreak };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['study-analytics'] });
    },
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_study_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Profile[];
    },
  });
};
