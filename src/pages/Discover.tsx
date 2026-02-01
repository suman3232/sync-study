import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinRoom, ROOM_CATEGORIES, RoomCategory } from '@/hooks/useStudyRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  BookOpen, 
  Users, 
  Timer, 
  Sparkles,
  Search,
  ArrowLeft,
  Globe,
  UserPlus,
  GraduationCap,
  Code,
  BookMarked,
  PenTool,
  Languages,
  Calculator,
  Palette
} from 'lucide-react';

interface PublicRoom {
  id: string;
  name: string;
  description: string | null;
  room_code: string;
  timer_duration: number;
  break_duration: number;
  category: RoomCategory;
  created_at: string;
  member_count: number;
  creator_name: string | null;
}

const usePublicRooms = (searchQuery: string, categoryFilter: string) => {
  return useQuery({
    queryKey: ['public-rooms', searchQuery, categoryFilter],
    queryFn: async () => {
      // Get all public rooms
      let query = supabase
        .from('study_rooms')
        .select('*')
        .eq('is_private', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data: rooms, error } = await query.limit(50);

      if (error) throw error;

      // Get member counts and creator names
      const roomsWithDetails = await Promise.all(
        (rooms || []).map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', room.created_by)
            .maybeSingle();

          return {
            ...room,
            member_count: count || 0,
            creator_name: creatorProfile?.full_name || 'Anonymous',
          };
        })
      );

      return roomsWithDetails as PublicRoom[];
    },
  });
};

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const joinRoom = useJoinRoom();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

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

  const { data: rooms, isLoading, refetch } = usePublicRooms(searchQuery, categoryFilter);

  const handleJoinRoom = async (room: PublicRoom) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setJoiningRoomId(room.id);
    try {
      await joinRoom.mutateAsync(room.id);
      toast({
        title: 'Joined Room!',
        description: `Welcome to ${room.name}`,
      });
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: 'Already a Member',
        description: 'You are already in this room.',
      });
      navigate(`/room/${room.id}`);
    } finally {
      setJoiningRoomId(null);
    }
  };

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
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl">Discover Rooms</span>
            </div>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8 animate-fade-in">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search public study rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.05s' }}>
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
            <TabsList className="inline-flex h-auto p-1 flex-wrap gap-1">
              <TabsTrigger value="all" className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                All
              </TabsTrigger>
              {ROOM_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-1.5">
                  {categoryIcons[cat.icon]}
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Browse public study rooms created by the community. Join any room to study together!
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Rooms Grid */}
        {!isLoading && rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, index) => (
              <Card 
                key={room.id} 
                className="hover:shadow-lg transition-all hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${0.15 + index * 0.05}s` }}
              >
                <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          {room.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {room.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs gap-1 ml-2">
                        {categoryIcons[ROOM_CATEGORIES.find(c => c.value === room.category)?.icon || 'BookOpen']}
                        {ROOM_CATEGORIES.find(c => c.value === room.category)?.label || 'General'}
                      </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>{room.timer_duration}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          <span>{room.break_duration}min break</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {room.member_count}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created by {room.creator_name}
                    </div>

                    <Button 
                      onClick={() => handleJoinRoom(room)}
                      className="w-full gap-2"
                      disabled={joiningRoomId === room.id}
                    >
                      <UserPlus className="h-4 w-4" />
                      {joiningRoomId === room.id ? 'Joining...' : 'Join Room'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && rooms && rooms.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery ? 'No rooms found' : 'No public rooms yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Be the first to create a public study room!'
                }
              </p>
              <Button variant="gradient" onClick={() => navigate('/dashboard')}>
                Create a Room
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Discover;
