import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Medal, Award, Clock, Timer } from 'lucide-react';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useLeaderboard();

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6" style={{ color: 'hsl(var(--rank-gold))' }} />;
      case 1:
        return <Medal className="h-6 w-6" style={{ color: 'hsl(var(--rank-silver))' }} />;
      case 2:
        return <Award className="h-6 w-6" style={{ color: 'hsl(var(--rank-bronze))' }} />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {index + 1}
          </span>
        );
    }
  };

  const getRankBackground = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-[hsl(var(--rank-gold-bg))] border-[hsl(var(--rank-gold)/0.3)]';
      case 1:
        return 'bg-[hsl(var(--rank-silver-bg))] border-[hsl(var(--rank-silver)/0.3)]';
      case 2:
        return 'bg-[hsl(var(--rank-bronze-bg))] border-[hsl(var(--rank-bronze)/0.3)]';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="font-display font-bold text-xl">Leaderboard</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Top Studiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((profile, index) => {
                  const isCurrentUser = profile.user_id === user?.id;
                  
                  return (
                    <div
                      key={profile.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        getRankBackground(index)
                      } ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        {getRankIcon(index)}
                      </div>
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {profile.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {profile.full_name || 'Anonymous'}
                          {isCurrentUser && (
                            <span className="text-primary ml-2 text-sm">(You)</span>
                          )}
                        </p>
                        {profile.study_goal && (
                          <p className="text-sm text-muted-foreground truncate">
                            {profile.study_goal}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatStudyTime(profile.total_study_time || 0)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {profile.pomodoro_count || 0} pomodoros
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No one on the leaderboard yet</h3>
                <p className="text-muted-foreground">
                  Start studying to be the first!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
