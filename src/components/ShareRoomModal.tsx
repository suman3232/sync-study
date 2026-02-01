import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link2, MessageSquare, Mail } from 'lucide-react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
}

const ShareRoomModal = ({ isOpen, onClose, roomCode, roomName }: ShareRoomModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/join/${roomCode}`;
  const shareMessage = `Join my study room "${roomName}" on SyncStudy! Code: ${roomCode}\n\n${shareUrl}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const shareVia = (platform: 'whatsapp' | 'telegram' | 'email') => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const links = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(`Join my study room "${roomName}" - Code: ${roomCode}`)}`,
      email: `mailto:?subject=${encodeURIComponent(`Join my study room: ${roomName}`)}&body=${encodedMessage}`,
    };

    window.open(links[platform], '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Room
          </DialogTitle>
          <DialogDescription>
            Invite friends to join "{roomName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Room Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Code</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-center font-mono text-2xl tracking-widest">
                {roomCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(roomCode, 'Room code')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(shareUrl, 'Link')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => shareVia('whatsapp')}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => shareVia('telegram')}
              >
                <MessageSquare className="h-4 w-4" />
                Telegram
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => shareVia('email')}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRoomModal;
