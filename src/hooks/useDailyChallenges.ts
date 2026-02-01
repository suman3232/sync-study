import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notifyChallengeComplete } from '@/utils/notifications';

interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: 'pomodoros' | 'study_time' | 'rooms_joined';
  target_value: number;
  xp_reward: number;
}

interface UserDailyProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed: boolean;
  challenge_date: string;
  completed_at: string | null;
}

interface ChallengeWithProgress extends DailyChallenge {
  progress: UserDailyProgress | null;
}

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['daily-challenges', user?.id],
    queryFn: async (): Promise<ChallengeWithProgress[]> => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];

      // Fetch all challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*');

      if (challengesError) throw challengesError;

      // Fetch user's progress for today
      const { data: progressData, error: progressError } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_date', today);

      if (progressError) throw progressError;

      // Map challenges with their progress
      return (challengesData || []).map((challenge) => ({
        ...challenge,
        challenge_type: challenge.challenge_type as 'pomodoros' | 'study_time' | 'rooms_joined',
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

      const today = new Date().toISOString().split('T')[0];

      // Check existing progress
      const { data: existing } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('challenge_date', today)
        .single();

      // Get challenge details
      const { data: challenge } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Challenge not found');

      const newValue = (existing?.current_value || 0) + incrementBy;
      const isNowCompleted = newValue >= challenge.target_value;

      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from('user_daily_progress')
          .update({
            current_value: newValue,
            completed: isNowCompleted,
            completed_at: isNowCompleted && !existing.completed ? new Date().toISOString() : existing.completed_at,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new progress
        const { error } = await supabase.from('user_daily_progress').insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_value: newValue,
          completed: isNowCompleted,
          completed_at: isNowCompleted ? new Date().toISOString() : null,
          challenge_date: today,
        });

        if (error) throw error;
      }

      return { challenge, isNowCompleted, wasAlreadyCompleted: existing?.completed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
      
      if (result.isNowCompleted && !result.wasAlreadyCompleted) {
        // Show browser push notification with sound
        notifyChallengeComplete(result.challenge.name, result.challenge.xp_reward, false);
        
        toast({
          title: '🎉 Challenge Complete!',
          description: `You earned ${result.challenge.xp_reward} XP for completing "${result.challenge.name}"`,
        });
      }
    },
  });

  const updateChallengeProgress = async (
    challengeType: 'pomodoros' | 'study_time' | 'rooms_joined',
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
    updateChallengeProgress,
    completedCount,
    totalXpEarned,
    totalChallenges: challenges?.length || 0,
  };
};
