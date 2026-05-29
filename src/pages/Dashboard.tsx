import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
const StudyAnalytics = React.lazy(() => import('@/components/StudyAnalytics')) as React.LazyExoticComponent<any>;
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
  Palette,
  Play,
  MoreVertical
} from 'lucide-react';
import { FileText } from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import { Star, Link as LinkIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('favRooms') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('favRooms', JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites]);

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

  // Fetch study sessions for the current user across visible rooms for the last 7 days
  const { data: roomStats } = useQuery({
    queryKey: ['room-stats', user?.id, rooms?.map((r) => r.id)],
    queryFn: async () => {
      if (!user || !rooms || rooms.length === 0) return {} as Record<string, { duration: number; count: number }>;
      const roomIds = rooms.map((r) => r.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('room_id, duration, completed_at')
        .in('room_id', roomIds)
        .gte('completed_at', sevenDaysAgo);

      const map: Record<string, { duration: number; count: number }> = {};
      (sessions || []).forEach((s: any) => {
        const id = s.room_id as string;
        if (!map[id]) map[id] = { duration: 0, count: 0 };
        map[id].duration += s.duration || 0;
        map[id].count += 1;
      });
      return map;
    },
    enabled: !!user && !!rooms && rooms.length > 0,
  });

  const toggleFavorite = (roomId: string | number) => {
    const id = String(roomId);
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((i) => i !== id) : [id, ...prev];
      try {
        localStorage.setItem('favRooms', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const copyRoomCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'Copied', description: 'Room code copied to clipboard' });
    } catch (e) {
      toast({ title: 'Error', description: 'Unable to copy to clipboard', variant: 'destructive' });
    }
  };

  const copyInviteLink = async (roomId: string) => {
    try {
      const url = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Invite copied', description: 'Invite link copied to clipboard' });
    } catch (e) {
      toast({ title: 'Error', description: 'Unable to copy invite', variant: 'destructive' });
    }
  };

  const startPomodoro = (roomId: string) => {
    navigate(`/room/${roomId}?startPomodoro=1`);
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
        <div className="container mx-auto px-4 py-3 md:py-0 h-14 md:h-12 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl truncate">SyncStudy</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/achievements')}>Achievements</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/leaderboard')}>Leaderboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar>
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-56px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch min-h-full">
          <section className="lg:col-span-2 flex flex-col gap-6 h-full">
            {/* Welcome */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
                Welcome back, {profile?.full_name || 'Studier'}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile?.study_goal || 'Ready to focus and achieve your goals?'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
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
            {rooms && favorites && rooms.filter(r => favorites.includes(String(r.id))).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-display font-semibold mb-3">Pinned Rooms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rooms.filter(r => favorites.includes(String(r.id))).map((room) => (
                    <Card key={`pinned-${room.id}`} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/room/${room.id}`)}>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-md truncate">{room.name}</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">{room.description || 'No description'}</CardDescription>
                          </div>
                          <Badge variant="outline">{room.room_code}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div className="animate-fade-in flex flex-col h-full" style={{ animationDelay: '0.35s' }}>
              <h2 className="text-xl font-display font-semibold mb-4">Your Study Rooms</h2>
              
              {rooms && rooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {rooms.map((room, index) => (
                    <Card 
                      key={room.id} 
                      className="cursor-pointer hover:shadow-lg transition-all animate-fade-in"
                      style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg truncate">{room.name}</CardTitle>
                              {room.is_private && (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <CardDescription className="mt-1 text-sm text-muted-foreground truncate">
                              {room.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                                {room.room_code}
                              </div>
                              <Badge variant="outline" className="text-xs">0 XP</Badge>
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
                          <div className="flex items-center gap-2">
                            {room.member_count !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-success/80" />
                                <span className="text-xs text-muted-foreground">{room.member_count} online</span>
                              </div>
                            )}
                            {room.member_count === 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                {room.member_count}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(room.id); }}
                              >
                                <Star className={`h-4 w-4 ${favorites.includes(String(room.id)) ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); }}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}?startPomodoro=1&duration=25`); }}>25 min</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}?startPomodoro=1&duration=50`); }}>50 min</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}?startPomodoro=1&duration=90`); }}>90 min</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}#documents`); }}>
                                <FileText className="h-4 w-4 mr-2" />
                                Docs
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.id}#files`); }}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Files
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); copyRoomCode(room.room_code); }}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); copyInviteLink(room.id); }}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Mini analytics */}
                        <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                          <div>
                            This week: {formatStudyTime(roomStats?.[room.id]?.duration || 0)}
                          </div>
                          <div>
                            Sessions: {roomStats?.[room.id]?.count || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed h-full">
                  <CardContent className="py-8 text-center flex flex-col justify-center h-full">
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

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card className="h-full min-h-[260px] border-dashed">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Weekly progress</CardTitle>
                        <CardDescription>
                          Stay on track with your weekly study goals and room activity.
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-muted p-4">
                        <p className="text-sm text-muted-foreground">Weekly minutes</p>
                        <p className="mt-2 text-lg font-semibold">{profile ? formatStudyTime(profile.total_study_time || 0) : '—'}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted p-4">
                        <p className="text-sm text-muted-foreground">Current streak</p>
                        <p className="mt-2 text-lg font-semibold">{profile?.current_streak || 0} days</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button className="w-full sm:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create room
                      </Button>
                      <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsJoinDialogOpen(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        Join room
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full min-h-[260px] border-dashed">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-secondary/10 p-3">
                        <Sparkles className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Study room tips</CardTitle>
                        <CardDescription>
                          Use rooms to share notes, keep your focus timer synced, and stay motivated.
                        </CardDescription>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <li>• Start a Pomodoro session with friends to keep momentum.</li>
                      <li>• Share documents and chat in the room for better collaboration.</li>
                      <li>• Track your weekly progress from the analytics panel.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Study Time</p>
                        <p className="text-sm font-semibold">{formatStudyTime(profile?.total_study_time || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-success/10">
                        <Timer className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pomodoros</p>
                        <p className="text-sm font-semibold">{profile?.pomodoro_count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-accent/10">
                        <Flame className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                        <p className="text-sm font-semibold">{profile?.current_streak || 0}d</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-secondary">
                        <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Best Streak</p>
                        <p className="text-sm font-semibold">{profile?.longest_streak || 0}d</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Challenges</h3>
              <div className="space-y-3">
                <DailyChallenges />
                <WeeklyChallenges />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant={showAnalytics ? 'default' : 'outline'}
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showAnalytics ? 'Hide Analytics' : 'View Weekly Analytics'}
              </Button>
              {showAnalytics && (
                <div>
                  <React.Suspense fallback={<div className="py-4"><div className="animate-pulse h-40 bg-muted rounded" /></div>}>
                    <StudyAnalytics />
                  </React.Suspense>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
