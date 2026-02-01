import { useNavigate } from 'react-router-dom';
import { useAchievementProgress } from '@/hooks/useAchievements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  BookOpen, 
  ArrowLeft,
  Trophy,
  Star,
  Timer,
  Zap,
  Target,
  Award,
  Crown,
  Clock,
  GraduationCap,
  Flame,
  Calendar,
  Medal,
  Rocket,
  Lock
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'timer': <Timer className="h-6 w-6" />,
  'zap': <Zap className="h-6 w-6" />,
  'target': <Target className="h-6 w-6" />,
  'award': <Award className="h-6 w-6" />,
  'crown': <Crown className="h-6 w-6" />,
  'clock': <Clock className="h-6 w-6" />,
  'book-open': <BookOpen className="h-6 w-6" />,
  'graduation-cap': <GraduationCap className="h-6 w-6" />,
  'trophy': <Trophy className="h-6 w-6" />,
  'flame': <Flame className="h-6 w-6" />,
  'calendar': <Calendar className="h-6 w-6" />,
  'star': <Star className="h-6 w-6" />,
  'medal': <Medal className="h-6 w-6" />,
  'rocket': <Rocket className="h-6 w-6" />,
};

const categoryLabels: Record<string, string> = {
  'pomodoro': 'Pomodoro Sessions',
  'study_time': 'Study Time',
  'streak': 'Study Streaks',
};

const formatRequirement = (type: string, value: number): string => {
  switch (type) {
    case 'pomodoro_count':
      return `${value} pomodoros`;
    case 'total_study_time':
      const hours = Math.floor(value / 60);
      return hours === 1 ? '1 hour' : `${hours} hours`;
    case 'current_streak':
    case 'longest_streak':
      return `${value} day streak`;
    default:
      return `${value}`;
  }
};

const Achievements = () => {
  const navigate = useNavigate();
  const { achievements, totalXp, earnedCount } = useAchievementProgress();

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">Achievements</span>
            </div>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Earned</p>
                  <p className="text-2xl font-bold">{earnedCount} / {achievements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-2xl font-bold">{totalXp.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">
                    {achievements.length > 0 
                      ? Math.round((earnedCount / achievements.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements], categoryIndex) => (
          <div 
            key={category} 
            className="mb-8 animate-fade-in"
            style={{ animationDelay: `${0.1 + categoryIndex * 0.1}s` }}
          >
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              {categoryLabels[category] || category}
              <Badge variant="secondary" className="ml-2">
                {categoryAchievements.filter(a => a.isEarned).length} / {categoryAchievements.length}
              </Badge>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement, index) => (
                <Card 
                  key={achievement.id}
                  className={`transition-all ${
                    achievement.isEarned 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'opacity-75'
                  }`}
                  style={{ animationDelay: `${0.15 + index * 0.05}s` }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        achievement.isEarned 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {achievement.isEarned 
                          ? iconMap[achievement.icon] || <Trophy className="h-6 w-6" />
                          : <Lock className="h-6 w-6" />
                        }
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {achievement.name}
                          {achievement.isEarned && (
                            <Badge variant="default" className="text-xs">
                              +{achievement.xp_reward} XP
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {achievement.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatRequirement(achievement.requirement_type, achievement.requirement_value)}
                        </span>
                        <span className={achievement.isEarned ? 'text-primary font-medium' : 'text-muted-foreground'}>
                          {achievement.isEarned ? 'Earned!' : `${Math.round(achievement.progress)}%`}
                        </span>
                      </div>
                      <Progress 
                        value={achievement.progress} 
                        className={`h-2 ${achievement.isEarned ? '[&>div]:bg-primary' : ''}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {achievements.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No achievements yet</h3>
              <p className="text-muted-foreground">
                Start studying to earn achievements!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Achievements;
