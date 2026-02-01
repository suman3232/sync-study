import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, MonitorUp, Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useVideoCall } from '@/hooks/useVideoCall';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
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
      isScreenShare && "col-span-2 row-span-2"
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
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs bg-background/80 px-2 py-1 rounded text-foreground">
          {isLocal ? 'You' : name}{isScreenShare ? ' (Screen)' : ''}
        </span>
        <div className="flex gap-1">
          {isMuted && !isScreenShare && (
            <div className="bg-destructive/80 p-1 rounded">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
          {isVideoOff && !isScreenShare && (
            <div className="bg-destructive/80 p-1 rounded">
              <VideoOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoCallModal = ({ open, onOpenChange, roomId, roomName }: VideoCallModalProps) => {
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

  const handleClose = () => {
    endCall();
    onOpenChange(false);
  };

  const participantCount = participants.size + (localStream ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Call - {roomName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Video Grid */}
        <div className="flex-1 bg-muted/30 rounded-lg p-4 overflow-auto">
          {!isConnected && !isConnecting ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Ready to join video call?</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Click the button below to join the video call with your study partners.
              </p>
              <Button onClick={startCall} size="lg" className="gap-2">
                <Phone className="h-5 w-5" />
                Join Call
              </Button>
            </div>
          ) : isConnecting ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Connecting to video call...</p>
            </div>
          ) : (
            <div className={cn(
              "grid gap-4 h-full",
              participantCount === 1 && !isScreenSharing && "grid-cols-1",
              participantCount === 2 && !isScreenSharing && "grid-cols-2",
              participantCount >= 3 && participantCount <= 4 && !isScreenSharing && "grid-cols-2 grid-rows-2",
              participantCount >= 5 && !isScreenSharing && "grid-cols-3",
              isScreenSharing && "grid-cols-3"
            )}>
              {/* Screen share - your screen */}
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
          )}
        </div>

        {/* Controls */}
        {isConnected && (
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant={isVideoOff ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? 'default' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleScreenShare}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleClose}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
