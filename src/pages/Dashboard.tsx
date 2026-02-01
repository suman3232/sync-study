import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMyRooms, useCreateRoom, useJoinRoom, useRoomByCode, ROOM_CATEGORIES, RoomCategory } from '@/hooks/useStudyRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import StudyAnalytics from '@/components/StudyAnalytics';
import { DailyChallenges } from '@/components/DailyChallenges';
import { WeeklyChallenges } from '@/components/WeeklyChallenges';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Timer, 
  Flame, 
  TrendingUp, 
  Settings, 
  Trophy,
  Clock,
  LogOut,
  Sparkles,
  BarChart3,
  Lock,
  Globe,
  GraduationCap,
  Code,
  BookMarked,
  PenTool,
  Languages,
  Calculator,
  Palette
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: rooms, isLoading: roomsLoading } = useMyRooms();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();
  const findRoomByCode = useRoomByCode();
  const { toast } = useToast();
  const { updateChallengeProgress } = useDailyChallenges();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [newRoomCategory, setNewRoomCategory] = useState<RoomCategory>('general');
  const [joinCode, setJoinCode] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const categoryIcons: Record<string, React.ReactNode> = {
    BookOpen: <BookOpen className="h-4 w-4" />,
    GraduationCap: <GraduationCap className="h-4 w-4" />,
    Code: <Code className="h-4 w-4" />,
    BookMarked: <BookMarked className="h-4 w-4" />,
    PenTool: <PenTool className="h-4 w-4" />,
    Languages: <Languages className="h-4 w-4" />,
    Calculator: <Calculator className="h-4 w-4" />,
    Palette: <Palette className="h-4 w-4" />,
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const room = await createRoom.mutateAsync({
        name: newRoomName,
        description: newRoomDescription || undefined,
        isPrivate: isPrivateRoom,
        category: newRoomCategory,
      });
      
      toast({
        title: 'Room Created!',
        description: `Your ${isPrivateRoom ? 'private' : 'public'} room code is: ${room.room_code}`,
      });
      
      setIsCreateDialogOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivateRoom(false);
      setNewRoomCategory('general');
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create room. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      const room = await findRoomByCode.mutateAsync(joinCode);
      const result = await joinRoom.mutateAsync(room.id);
      
      // Update daily challenge progress if this is a new join
      if (result?.isNewJoin) {
        await updateChallengeProgress('rooms_joined', 1);
      }
      
      toast({
        title: 'Joined Room!',
        description: `Welcome to ${room.name}`,
      });
      
      setIsJoinDialogOpen(false);
      setJoinCode('');
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: 'Room Not Found',
        description: 'Please check the room code and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (profileLoading || roomsLoading) {
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">SyncStudy</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/achievements')}>
              <Trophy className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')}>
              <TrendingUp className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {profile?.full_name || 'Studier'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.study_goal || 'Ready to focus and achieve your goals?'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Study Time</p>
                  <p className="text-lg font-bold">
                    {formatStudyTime(profile?.total_study_time || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Timer className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pomodoros</p>
                  <p className="text-lg font-bold">{profile?.pomodoro_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Flame className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-lg font-bold">{profile?.current_streak || 0} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="text-lg font-bold">{profile?.longest_streak || 0} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-fade-in" style={{ animationDelay: '0.28s' }}>
            <DailyChallenges />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.32s' }}>
            <WeeklyChallenges />
          </div>
        </div>

        {/* Analytics Toggle */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.28s' }}>
          <Button
            variant={showAnalytics ? 'default' : 'outline'}
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showAnalytics ? 'Hide Analytics' : 'View Weekly Analytics'}
          </Button>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-8 animate-fade-in">
            <StudyAnalytics />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Study Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Study Room</DialogTitle>
                <DialogDescription>
                  Create a new room to study with friends. Share the room code to invite others.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    placeholder="e.g., Math Study Group"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-description">Description (optional)</Label>
                  <Input
                    id="room-description"
                    placeholder="What will you be studying?"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-category">Category</Label>
                  <Select value={newRoomCategory} onValueChange={(value) => setNewRoomCategory(value as RoomCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            {categoryIcons[cat.icon]}
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {isPrivateRoom ? (
                      <Lock className="h-5 w-5 text-primary" />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {isPrivateRoom ? 'Private Room' : 'Public Room'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPrivateRoom 
                          ? 'Only people with the code can join' 
                          : 'Anyone can discover and join'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPrivateRoom}
                    onCheckedChange={setIsPrivateRoom}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createRoom.isPending}>
                  {createRoom.isPending ? 'Creating...' : 'Create Room'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <Users className="h-5 w-5" />
                Join with Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Study Room</DialogTitle>
                <DialogDescription>
                  Enter the 6-character room code shared by your study partner.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinRoom} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Room Code</Label>
                  <Input
                    id="join-code"
                    placeholder="ABCD12"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={findRoomByCode.isPending || joinRoom.isPending}
                >
                  {findRoomByCode.isPending || joinRoom.isPending ? 'Joining...' : 'Join Room'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="secondary" 
            size="lg" 
            className="gap-2"
            onClick={() => navigate('/discover')}
          >
            <Globe className="h-5 w-5" />
            Discover Rooms
          </Button>
        </div>

        {/* Rooms List */}
        <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-xl font-display font-semibold mb-4">Your Study Rooms</h2>
          
          {rooms && rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room, index) => (
                <Card 
                  key={room.id} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 animate-fade-in"
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          {room.is_private && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {room.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                          {room.room_code}
                        </div>
                        <Badge variant="outline" className="text-xs gap-1">
                          {categoryIcons[ROOM_CATEGORIES.find(c => c.value === room.category)?.icon || 'BookOpen']}
                          {ROOM_CATEGORIES.find(c => c.value === room.category)?.label || 'General'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>{room.timer_duration}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          <span>{room.break_duration}min break</span>
                        </div>
                      </div>
                      {room.member_count !== undefined && (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {room.member_count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No study rooms yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first room or join one with a code
                </p>
                <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Room
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
