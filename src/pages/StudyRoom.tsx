import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom, useRoomMembers, useUpdateMemberStatus, useLeaveRoom, useUpdateRoom } from '@/hooks/useStudyRooms';
import { useRoomTimer, useUpdateTimer } from '@/hooks/useRoomTimer';
import { useRoomNotes, useUpdateNotes } from '@/hooks/useRoomNotes';
import { useRoomChat, useSendMessage } from '@/hooks/useRoomChat';
import { useCompletePomodoro } from '@/hooks/useProfile';
import { useCheckAndAwardAchievements } from '@/hooks/useAchievements';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import VideoCallModal from '@/components/VideoCallModal';
import VideoCallInline from '@/components/VideoCallInline';
import RoomSettingsModal from '@/components/RoomSettingsModal';
import ShareRoomModal from '@/components/ShareRoomModal';
import InlineFocusMusic from '@/components/InlineFocusMusic';
import RoomDocuments from '@/components/RoomDocuments';
import ThemeToggle from '@/components/ThemeToggle';
import { LiveActivityIndicator, StatusDot } from '@/components/LiveActivityIndicator';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { 
  notifyTimerComplete, 
  notifyAchievementUnlocked, 
  notifyRoomActivity,
  requestNotificationPermission 
} from '@/utils/notifications';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Users, 
  FileText, 
  MessageSquare,
  Video,
  Copy,
  Coffee,
  Settings,
  LogOut,
  MoreVertical,
  Share2,
  Keyboard,
  FolderOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StudyRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: members } = useRoomMembers(roomId);
  const { data: timer } = useRoomTimer(roomId);
  const { data: notes } = useRoomNotes(roomId);
  const { data: messages } = useRoomChat(roomId);

  const updateTimer = useUpdateTimer();
  const updateNotes = useUpdateNotes();
  const sendMessage = useSendMessage();
  const updateStatus = useUpdateMemberStatus();
  const completePomodoro = useCompletePomodoro();
  const checkAchievements = useCheckAndAwardAchievements();
  const leaveRoom = useLeaveRoom();
  const updateRoom = useUpdateRoom();
  const { updateChallengeProgress } = useDailyChallenges();

  const [localTimeRemaining, setLocalTimeRemaining] = useState(1500);
  const [notesContent, setNotesContent] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'documents' | 'chat' | 'participants' | 'video'>('notes');
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notesDebounceRef = useRef<NodeJS.Timeout>();
  const timerCompletedRef = useRef(false);

  const isCreator = room?.created_by === user?.id;

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Subscribe to realtime member updates with notifications
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`members-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
          
          // Notify about new members (except self)
          if (payload.new && (payload.new as any).user_id !== user.id) {
            // Fetch the new member's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', (payload.new as any).user_id)
              .single();
            
            const memberName = profile?.full_name || 'Someone';
            notifyRoomActivity('member_joined', `${memberName} joined the room`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient, user]);

  // Sync local timer with server state
  useEffect(() => {
    if (timer) {
      if (timer.is_running && timer.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(timer.started_at).getTime()) / 1000);
        const remaining = Math.max(0, timer.time_remaining - elapsed);
        setLocalTimeRemaining(remaining);
      } else {
        setLocalTimeRemaining(timer.time_remaining);
      }
      timerCompletedRef.current = false;
    }
  }, [timer]);

  // Timer countdown
  useEffect(() => {
    if (!timer?.is_running || !roomId) return;

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => {
        if (prev <= 1 && !timerCompletedRef.current) {
          timerCompletedRef.current = true;
          handleTimerComplete();
          return 0;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer?.is_running, roomId]);

  // Sync notes from server
  useEffect(() => {
    if (notes?.content !== undefined) {
      setNotesContent(notes.content);
    }
  }, [notes?.content]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTimerComplete = async () => {
    if (!roomId || !room || !user) return;

    const isBreak = timer?.is_break || false;
    
    // Play sound and show browser notification
    notifyTimerComplete(isBreak);
    
    if (!isBreak) {
      // Completed a study session
      await completePomodoro.mutateAsync({
        roomId,
        duration: room.timer_duration,
      });

      // Update daily challenge progress
      await updateChallengeProgress('pomodoros', 1);
      await updateChallengeProgress('study_time', room.timer_duration);

      // Check for new achievements
      const newAchievements = await checkAchievements.mutateAsync();
      
      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          // Browser push notification for achievement
          notifyAchievementUnlocked(achievement.name, achievement.xp_reward);
          
          toast({
            title: `🏆 Achievement Unlocked!`,
            description: `${achievement.name} - +${achievement.xp_reward} XP`,
          });
        });
      }
      
      toast({
        title: '🎉 Pomodoro complete!',
        description: 'Take a well-deserved break.',
      });
    } else {
      toast({
        title: '⚡ Break over!',
        description: 'Time to focus!',
      });
    }

    // Switch to break or back to study
    await updateTimer.mutateAsync({
      roomId,
      updates: {
        is_running: false,
        is_break: !isBreak,
        time_remaining: isBreak ? room.timer_duration * 60 : room.break_duration * 60,
        started_at: null,
      },
      action: isBreak ? 'Break ended' : 'Pomodoro completed',
    });

    await updateStatus.mutateAsync({
      roomId,
      status: 'idle',
    });
  };

  const handleStartTimer = useCallback(async () => {
    if (!roomId) return;

    await updateTimer.mutateAsync({
      roomId,
      updates: {
        is_running: true,
        started_at: new Date().toISOString(),
      },
      action: 'started',
    });

    await updateStatus.mutateAsync({
      roomId,
      status: timer?.is_break ? 'break' : 'studying',
    });
  }, [roomId, timer?.is_break, updateTimer, updateStatus]);

  const handlePauseTimer = useCallback(async () => {
    if (!roomId) return;

    await updateTimer.mutateAsync({
      roomId,
      updates: {
        is_running: false,
        time_remaining: localTimeRemaining,
        started_at: null,
      },
      action: 'paused',
    });

    await updateStatus.mutateAsync({
      roomId,
      status: 'idle',
    });
  }, [roomId, localTimeRemaining, updateTimer, updateStatus]);

  const handleResetTimer = useCallback(async () => {
    if (!roomId || !room) return;

    await updateTimer.mutateAsync({
      roomId,
      updates: {
        is_running: false,
        is_break: false,
        time_remaining: room.timer_duration * 60,
        started_at: null,
      },
      action: 'reset',
    });

    await updateStatus.mutateAsync({
      roomId,
      status: 'idle',
    });
  }, [roomId, room, updateTimer, updateStatus]);

  // Keyboard shortcuts for timer controls
  const handleStartPause = useCallback(() => {
    if (timer?.is_running) {
      handlePauseTimer();
    } else {
      handleStartTimer();
    }
  }, [timer?.is_running, handlePauseTimer, handleStartTimer]);

  useKeyboardShortcuts({
    onStartPause: handleStartPause,
    onReset: handleResetTimer,
  });

  const handleNotesChange = (content: string) => {
    setNotesContent(content);
    
    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current);
    }
    
    notesDebounceRef.current = setTimeout(() => {
      if (roomId) {
        updateNotes.mutate({ roomId, content });
      }
    }, 500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !roomId) return;

    await sendMessage.mutateAsync({
      roomId,
      content: chatMessage,
    });
    
    setChatMessage('');
  };

  const copyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      toast({
        title: 'Copied!',
        description: 'Room code copied to clipboard.',
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    
    try {
      await leaveRoom.mutateAsync(roomId);
      toast({
        title: 'Left room',
        description: 'You have left the study room.',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave room.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = async (settings: { timerDuration: number; breakDuration: number }) => {
    if (!roomId) return;
    
    await updateRoom.mutateAsync({
      roomId,
      updates: {
        timer_duration: settings.timerDuration,
        break_duration: settings.breakDuration,
      },
    });

    // Also update the timer state if not running
    if (!timer?.is_running) {
      await updateTimer.mutateAsync({
        roomId,
        updates: {
          time_remaining: settings.timerDuration * 60,
          is_break: false,
        },
        action: 'Settings updated',
      });
    }

    toast({
      title: 'Settings saved',
      description: 'Room settings have been updated.',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'studying':
        return 'bg-primary text-primary-foreground';
      case 'break':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate timer ring progress
  const maxTime = timer?.is_break 
    ? (room?.break_duration || 5) * 60 
    : (room?.timer_duration || 25) * 60;
  const progress = (localTimeRemaining / maxTime) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Room not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display font-semibold">{room.name}</h1>
              <div 
                className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground"
                onClick={copyRoomCode}
              >
                <span>Code: {room.room_code}</span>
                <Copy className="h-3 w-3" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Space: Start/Pause • R: Reset</p>
              </TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsShareOpen(true)}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsVideoCallOpen(true)}
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Room Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLeaveRoom}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Timer Section */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center">
          <div className="relative animate-scale-in">
            {/* Timer Ring */}
            <svg className="w-72 h-72 transform -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="144"
                cy="144"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`timer-ring ${timer?.is_break ? 'text-success' : 'text-primary'}`}
              />
            </svg>
            
            {/* Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-2">
                {timer?.is_break && <Coffee className="h-5 w-5 text-success" />}
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {timer?.is_break ? 'Break Time' : 'Focus Time'}
                </span>
              </div>
              <span className="text-6xl font-display font-bold tabular-nums">
                {formatTime(localTimeRemaining)}
              </span>
              {timer?.last_action && (
                <span className="text-xs text-muted-foreground mt-2">
                  Last: {timer.last_action}
                </span>
              )}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={handleResetTimer}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            
            {timer?.is_running ? (
              <Button
                variant="destructive"
                size="lg"
                className="h-14 w-32"
                onClick={handlePauseTimer}
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                className="h-14 w-32"
                onClick={handleStartTimer}
              >
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            )}
          </div>

          {/* Focus Music - Under Timer Controls */}
          <InlineFocusMusic />
        </div>

        {/* Right Panel */}
        <div className="lg:w-1/2 flex flex-col animate-slide-in-right">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={activeTab === 'notes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('notes')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Notes
            </Button>
            <Button
              variant={activeTab === 'documents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('documents')}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chat')}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'participants' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('participants')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Participants</span>
              <Badge variant="secondary" className="ml-1">
                {members?.length || 0}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'video' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('video')}
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </Button>
          </div>

          {/* Panel Content */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'notes' && (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Shared Notes</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <Textarea
                    placeholder="Start taking notes... Everyone in the room can see and edit these notes."
                    value={notesContent}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="h-full min-h-[300px] resize-none"
                  />
                </CardContent>
              </>
            )}

            {activeTab === 'documents' && (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Shared Documents</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <RoomDocuments roomId={roomId || ''} />
                </CardContent>
              </>
            )}

            {activeTab === 'chat' && (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Room Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pb-4">
                  <ScrollArea className="flex-1 pr-4 mb-4 max-h-[350px]">
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {msg.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-sm">
                                {msg.profile?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!chatMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {activeTab === 'participants' && (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Participants
                    <Badge variant="secondary" className="font-normal">
                      {members?.length || 0}
                    </Badge>
                    {members?.some(m => m.status === 'studying') && (
                      <span className="text-xs text-muted-foreground font-normal ml-auto flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        {members.filter(m => m.status === 'studying').length} studying
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Sort members: studying first, then break, then idle */}
                    {members
                      ?.slice()
                      .sort((a, b) => {
                        const order = { studying: 0, break: 1, idle: 2 };
                        return order[a.status] - order[b.status];
                      })
                      .map((member) => (
                        <div 
                          key={member.id} 
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
                            member.status === 'studying' && "bg-primary/5 border border-primary/10",
                            member.status === 'break' && "bg-success/5 border border-success/10",
                            member.status === 'idle' && "bg-muted/50"
                          )}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {member.profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <StatusDot status={member.status} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.profile?.full_name || 'Anonymous'}
                              {member.user_id === user?.id && (
                                <span className="text-muted-foreground text-sm ml-2">(you)</span>
                              )}
                            </p>
                          </div>
                          <LiveActivityIndicator status={member.status} size="sm" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </>
            )}

            {activeTab === 'video' && (
              <VideoCallInline
                roomId={roomId || ''}
                roomName={room.name}
                onExpand={() => setIsVideoCallOpen(true)}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Video Call Modal */}
      <VideoCallModal
        open={isVideoCallOpen}
        onOpenChange={setIsVideoCallOpen}
        roomId={roomId || ''}
        roomName={room.name}
      />

      {/* Room Settings Modal */}
      <RoomSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        roomName={room.name}
        timerDuration={room.timer_duration}
        breakDuration={room.break_duration}
        isCreator={isCreator}
        onSave={handleSaveSettings}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomCode={room.room_code}
        roomName={room.name}
      />
    </div>
  );
};

export default StudyRoom;
