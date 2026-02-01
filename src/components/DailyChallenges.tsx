import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Users, CheckCircle2, Flame, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const challengeIcons = {
  pomodoros: Target,
  study_time: Clock,
  rooms_joined: Users,
};

export const DailyChallenges = () => {
  const { challenges, isLoading, completedCount, totalChallenges, totalXpEarned } = useDailyChallenges();

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Daily Challenges
          </CardTitle>
          <div className="flex items-center gap-2">
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
          const Icon = challengeIcons[challenge.challenge_type];
          const progress = challenge.progress;
          const currentValue = progress?.current_value || 0;
          const progressPercent = Math.min((currentValue / challenge.target_value) * 100, 100);
          const isCompleted = progress?.completed;

          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-muted/30 border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isCompleted ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`font-medium text-sm ${
                        isCompleted ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {challenge.name}
                    </h4>
                    <Badge
                      variant={isCompleted ? 'default' : 'outline'}
                      className="text-xs shrink-0"
                    >
                      +{challenge.xp_reward} XP
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {challenge.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={progressPercent} className="h-1.5 flex-1" />
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
            No challenges available today
          </p>
        )}
      </CardContent>
    </Card>
  );
};
