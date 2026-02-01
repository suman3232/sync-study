import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, Clock, Coffee } from 'lucide-react';

interface RoomSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  timerDuration: number;
  breakDuration: number;
  isCreator: boolean;
  onSave: (settings: { timerDuration: number; breakDuration: number }) => Promise<void>;
}

const RoomSettingsModal = ({ 
  open, 
  onOpenChange, 
  roomName,
  timerDuration: initialTimer,
  breakDuration: initialBreak,
  isCreator,
  onSave,
}: RoomSettingsModalProps) => {
  const [timerDuration, setTimerDuration] = useState(initialTimer);
  const [breakDuration, setBreakDuration] = useState(initialBreak);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ timerDuration, breakDuration });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </DialogTitle>
          <DialogDescription>
            {isCreator 
              ? 'Customize timer settings for this room'
              : 'Only the room creator can change these settings'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Focus Duration
              </Label>
              <span className="text-sm font-medium">{timerDuration} min</span>
            </div>
            <Slider
              value={[timerDuration]}
              onValueChange={([value]) => setTimerDuration(value)}
              min={5}
              max={60}
              step={5}
              disabled={!isCreator}
            />
            <p className="text-xs text-muted-foreground">
              How long each Pomodoro session lasts
            </p>
          </div>

          {/* Break Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-success" />
                Break Duration
              </Label>
              <span className="text-sm font-medium">{breakDuration} min</span>
            </div>
            <Slider
              value={[breakDuration]}
              onValueChange={([value]) => setBreakDuration(value)}
              min={1}
              max={30}
              step={1}
              disabled={!isCreator}
            />
            <p className="text-xs text-muted-foreground">
              How long breaks last between sessions
            </p>
          </div>
        </div>

        {isCreator && (
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoomSettingsModal;
