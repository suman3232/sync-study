import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, MonitorUp, Loader2, Maximize2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useVideoCall } from '@/hooks/useVideoCall';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VideoCallInlineProps {
  roomId: string;
  roomName: string;
  onExpand?: () => void;
}

const VideoTile = ({ 
  stream, 
  name, 
  isMuted, 
  isVideoOff,
  isLocal = false,
  isScreenShare = false
}: { 
  stream: MediaStream | null; 
  name: string; 
  isMuted: boolean;
  isVideoOff: boolean;
  isLocal?: boolean;
  isScreenShare?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden bg-muted aspect-video",
      isLocal && !isScreenShare && "border-2 border-primary",
      isScreenShare && "col-span-full border-2 border-green-500"
    )}>
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
        <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-foreground">
          {isLocal ? 'You' : name}{isScreenShare ? ' (Screen)' : ''}
        </span>
        <div className="flex gap-0.5">
          {isMuted && !isScreenShare && (
            <div className="bg-destructive/80 p-0.5 rounded">
              <MicOff className="h-2.5 w-2.5 text-white" />
            </div>
          )}
          {isVideoOff && !isScreenShare && (
            <div className="bg-destructive/80 p-0.5 rounded">
              <VideoOff className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoCallInline = ({ roomId, roomName, onExpand }: VideoCallInlineProps) => {
  const {
    isConnected,
    isConnecting,
    localStream,
    screenStream,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    error,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useVideoCall(roomId);

  const participantCount = participants.size + (localStream ? 1 : 0);

  if (!isConnected && !isConnecting) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">Video Call</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Join a video call with your study partners
            </p>
          </div>
          <Button onClick={startCall} className="gap-2">
            <Phone className="h-4 w-4" />
            Join Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isConnecting) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center gap-4 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-2 px-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          Video Call
          <span className="text-xs text-muted-foreground">
            ({participantCount})
          </span>
        </CardTitle>
        {onExpand && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpand}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      {error && (
        <Alert variant="destructive" className="mx-3 mb-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Video Grid */}
      <CardContent className="flex-1 p-2 overflow-auto">
        <div className={cn(
          "grid gap-2",
          participantCount === 1 && !isScreenSharing && "grid-cols-1",
          participantCount === 2 && !isScreenSharing && "grid-cols-2",
          participantCount >= 3 && !isScreenSharing && "grid-cols-2",
          isScreenSharing && "grid-cols-1"
        )}>
          {/* Screen share - show prominently */}
          {screenStream && (
            <VideoTile
              stream={screenStream}
              name="You"
              isMuted={false}
              isVideoOff={false}
              isLocal
              isScreenShare
            />
          )}

          {/* Participant screen shares */}
          {Array.from(participants.values())
            .filter(p => p.isScreenSharing && p.screenStream)
            .map((participant) => (
              <VideoTile
                key={`${participant.id}-screen`}
                stream={participant.screenStream || null}
                name={participant.name}
                isMuted={false}
                isVideoOff={false}
                isScreenShare
              />
            ))}

          {/* Local video */}
          {localStream && (
            <VideoTile
              stream={localStream}
              name="You"
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isLocal
            />
          )}
          
          {/* Remote participants */}
          {Array.from(participants.values()).map((participant) => (
            <VideoTile
              key={participant.id}
              stream={participant.stream || null}
              name={participant.name}
              isMuted={participant.isMuted}
              isVideoOff={participant.isVideoOff}
            />
          ))}
        </div>
      </CardContent>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-2 border-t">
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <Button
          variant={isVideoOff ? 'destructive' : 'secondary'}
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </Button>

        <Button
          variant={isScreenSharing ? 'default' : 'secondary'}
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <MonitorUp className="h-4 w-4" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={endCall}
          title="Leave call"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default VideoCallInline;
