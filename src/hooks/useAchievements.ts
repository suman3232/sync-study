import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });
};

export const useCheckAndAwardAchievements = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !profile || !achievements || !userAchievements) return [];

      const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
      const newlyEarned: Achievement[] = [];

      for (const achievement of achievements) {
        if (earnedIds.has(achievement.id)) continue;

        let isEarned = false;

        switch (achievement.requirement_type) {
          case 'pomodoro_count':
            isEarned = (profile.pomodoro_count || 0) >= achievement.requirement_value;
            break;
          case 'total_study_time':
            isEarned = (profile.total_study_time || 0) >= achievement.requirement_value;
            break;
          case 'current_streak':
            isEarned = (profile.current_streak || 0) >= achievement.requirement_value;
            break;
          case 'longest_streak':
            isEarned = (profile.longest_streak || 0) >= achievement.requirement_value;
            break;
        }

        if (isEarned) {
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          if (!error) {
            newlyEarned.push(achievement);
          }
        }
      }

      return newlyEarned;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
};

export const useAchievementProgress = () => {
  const { data: profile } = useProfile();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  if (!profile || !achievements || !userAchievements) {
    return { achievements: [], totalXp: 0, earnedCount: 0 };
  }

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const totalXp = userAchievements.reduce((sum, ua) => {
    return sum + (ua.achievement?.xp_reward || 0);
  }, 0);

  const achievementsWithProgress = achievements.map(achievement => {
    let currentValue = 0;

    switch (achievement.requirement_type) {
      case 'pomodoro_count':
        currentValue = profile.pomodoro_count || 0;
        break;
      case 'total_study_time':
        currentValue = profile.total_study_time || 0;
        break;
      case 'current_streak':
        currentValue = profile.current_streak || 0;
        break;
      case 'longest_streak':
        currentValue = profile.longest_streak || 0;
        break;
    }

    const progress = Math.min(100, (currentValue / achievement.requirement_value) * 100);
    const isEarned = earnedIds.has(achievement.id);

    return {
      ...achievement,
      currentValue,
      progress,
      isEarned,
    };
  });

  return {
    achievements: achievementsWithProgress,
    totalXp,
    earnedCount: earnedIds.size,
  };
};
