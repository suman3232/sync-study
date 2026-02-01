import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Users, CheckCircle2, Trophy, Zap, Calendar, Flame, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const challengeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pomodoros: Target,
  study_time: Clock,
  rooms_joined: Users,
  streak_days: Flame,
  daily_challenges: Star,
};

export const WeeklyChallenges = () => {
  const { challenges, isLoading, completedCount, totalChallenges, totalXpEarned, daysRemaining } = useWeeklyChallenges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Weekly Challenges
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-muted/50">
              <Calendar className="h-3 w-3" />
              {daysRemaining}d left
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              {totalXpEarned} XP
            </Badge>
            <Badge variant="outline">
              {completedCount}/{totalChallenges}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges?.map((challenge) => {
          const Icon = challengeIcons[challenge.challenge_type] || Target;
          const progress = challenge.progress;
          const currentValue = progress?.current_value || 0;
          const progressPercent = Math.min((currentValue / challenge.target_value) * 100, 100);
          const isCompleted = progress?.completed;

          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-card/50 border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isCompleted ? 'bg-yellow-500/20' : 'bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`font-medium text-sm ${
                        isCompleted ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'
                      }`}
                    >
                      {challenge.name}
                    </h4>
                    <Badge
                      variant={isCompleted ? 'default' : 'outline'}
                      className={`text-xs shrink-0 ${isCompleted ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                    >
                      +{challenge.xp_reward} XP
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {challenge.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress 
                      value={progressPercent} 
                      className={`h-1.5 flex-1 ${isCompleted ? '[&>div]:bg-yellow-500' : ''}`}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {currentValue}/{challenge.target_value}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {challenges?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No weekly challenges available
          </p>
        )}
      </CardContent>
    </Card>
  );
};
