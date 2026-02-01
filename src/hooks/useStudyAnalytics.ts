import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, eachDayOfInterval, format, subDays } from 'date-fns';

export interface DailyStudyData {
  date: string;
  dayName: string;
  minutes: number;
  pomodoros: number;
}

export const useStudyAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get last 7 days
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);
      
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Create array for last 7 days
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
      
      const dailyData: DailyStudyData[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySessions = sessions?.filter(s => 
          format(new Date(s.completed_at), 'yyyy-MM-dd') === dayStr
        ) || [];
        
        const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
        
        return {
          date: dayStr,
          dayName: format(day, 'EEE'),
          minutes: totalMinutes,
          pomodoros: daySessions.length,
        };
      });

      // Calculate weekly totals
      const weeklyMinutes = dailyData.reduce((sum, d) => sum + d.minutes, 0);
      const weeklyPomodoros = dailyData.reduce((sum, d) => sum + d.pomodoros, 0);
      const avgDailyMinutes = Math.round(weeklyMinutes / 7);

      return {
        dailyData,
        weeklyMinutes,
        weeklyPomodoros,
        avgDailyMinutes,
      };
    },
    enabled: !!user,
  });
};
