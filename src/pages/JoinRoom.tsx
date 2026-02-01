import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinRoom, useRoomByCode } from '@/hooks/useStudyRooms';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen } from 'lucide-react';

const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const findRoomByCode = useRoomByCode();
  const joinRoom = useJoinRoom();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Store the room code and redirect to auth
      sessionStorage.setItem('pendingRoomCode', code || '');
      navigate('/auth');
      return;
    }

    const joinWithCode = async () => {
      if (!code) {
        navigate('/dashboard');
        return;
      }

      try {
        const room = await findRoomByCode.mutateAsync(code);
        await joinRoom.mutateAsync(room.id);
        
        toast({
          title: 'Joined Room!',
          description: `Welcome to ${room.name}`,
        });
        
        navigate(`/room/${room.id}`);
      } catch {
        toast({
          title: 'Room Not Found',
          description: 'The room code is invalid or the room no longer exists.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    };

    joinWithCode();
  }, [code, user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-8 w-8 text-primary" />
        <span className="font-display font-bold text-2xl">SyncStudy</span>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Joining room...</p>
    </div>
  );
};

export default JoinRoom;
