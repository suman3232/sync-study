import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, Timer, Calendar } from 'lucide-react';

const StudyAnalytics = () => {
  const { data: analytics, isLoading } = useStudyAnalytics();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const maxMinutes = Math.max(...analytics.dailyData.map(d => d.minutes), 1);

  return (
    <div className="space-y-4">
      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatTime(analytics.weeklyMinutes)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Pomodoros</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {analytics.weeklyPomodoros}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">Daily Avg</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatTime(analytics.avgDailyMinutes)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="dayName" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  hide 
                  domain={[0, maxMinutes * 1.1]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(data.minutes)} • {data.pomodoros} pomodoros
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="minutes" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {analytics.dailyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.minutes > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {analytics.weeklyMinutes === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              No study sessions this week. Start a Pomodoro to track your progress!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyAnalytics;
