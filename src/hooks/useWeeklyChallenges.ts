import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyChallengeComplete } from '@/utils/notifications';

interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: 'pomodoros' | 'study_time' | 'rooms_joined' | 'streak_days' | 'daily_challenges';
  target_value: number;
  xp_reward: number;
}

interface UserWeeklyProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed: boolean;
  week_start: string;
  completed_at: string | null;
}

interface WeeklyChallengeWithProgress extends WeeklyChallenge {
  progress: UserWeeklyProgress | null;
}

const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
};

const getWeekEnd = () => {
  const weekStart = new Date(getWeekStart());
  weekStart.setDate(weekStart.getDate() + 6);
  return weekStart;
};

export const useWeeklyChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['weekly-challenges', user?.id, weekStart],
    queryFn: async (): Promise<WeeklyChallengeWithProgress[]> => {
      if (!user) return [];

      // Fetch all weekly challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('weekly_challenges')
        .select('*');

      if (challengesError) throw challengesError;

      // Fetch user's progress for this week
      const { data: progressData, error: progressError } = await supabase
        .from('user_weekly_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

      if (progressError) throw progressError;

      // Map challenges with their progress
      return (challengesData || []).map((challenge) => ({
        ...challenge,
        challenge_type: challenge.challenge_type as WeeklyChallenge['challenge_type'],
        progress: progressData?.find((p) => p.challenge_id === challenge.id) || null,
      }));
    },
    enabled: !!user,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      challengeId,
      incrementBy = 1,
    }: {
      challengeId: string;
      incrementBy?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check existing progress
      const { data: existing } = await supabase
        .from('user_weekly_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('week_start', weekStart)
        .single();

      // Get challenge details
      const { data: challenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Challenge not found');

      const newValue = (existing?.current_value || 0) + incrementBy;
      const isNowCompleted = newValue >= challenge.target_value;

      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from('user_weekly_progress')
          .update({
            current_value: newValue,
            completed: isNowCompleted,
            completed_at: isNowCompleted && !existing.completed ? new Date().toISOString() : existing.completed_at,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new progress
        const { error } = await supabase.from('user_weekly_progress').insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_value: newValue,
          completed: isNowCompleted,
          completed_at: isNowCompleted ? new Date().toISOString() : null,
          week_start: weekStart,
        });

        if (error) throw error;
      }

      return { challenge, isNowCompleted, wasAlreadyCompleted: existing?.completed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-challenges'] });
      
      if (result.isNowCompleted && !result.wasAlreadyCompleted) {
        // Show browser push notification with sound
        notifyChallengeComplete(result.challenge.name, result.challenge.xp_reward, true);
        
        toast({
          title: '🏆 Weekly Challenge Complete!',
          description: `Amazing! You earned ${result.challenge.xp_reward} XP for completing "${result.challenge.name}"`,
        });
      }
    },
  });

  const updateWeeklyChallengeProgress = async (
    challengeType: WeeklyChallenge['challenge_type'],
    incrementBy = 1
  ) => {
    if (!challenges) return;

    // Find all challenges of this type and update their progress
    const matchingChallenges = challenges.filter(
      (c) => c.challenge_type === challengeType && !c.progress?.completed
    );

    for (const challenge of matchingChallenges) {
      await updateProgressMutation.mutateAsync({
        challengeId: challenge.id,
        incrementBy,
      });
    }
  };

  const completedCount = challenges?.filter((c) => c.progress?.completed).length || 0;
  const totalXpEarned = challenges
    ?.filter((c) => c.progress?.completed)
    .reduce((sum, c) => sum + c.xp_reward, 0) || 0;

  return {
    challenges,
    isLoading,
    updateWeeklyChallengeProgress,
    completedCount,
    totalXpEarned,
    totalChallenges: challenges?.length || 0,
    daysRemaining,
    weekStart,
  };
};
