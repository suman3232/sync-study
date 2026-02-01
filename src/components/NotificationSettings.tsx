import { Bell, Clock, Trophy, Users, Volume2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { requestNotificationPermission, canShowNotifications } from '@/utils/notifications';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

const NotificationSettings = () => {
  const { settings, updateSetting, resetToDefaults } = useNotificationSettings();
  const { toast } = useToast();
  const [permissionGranted, setPermissionGranted] = useState(canShowNotifications());

  useEffect(() => {
    setPermissionGranted(canShowNotifications());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      toast({
        title: 'Notifications enabled!',
        description: 'You will now receive browser notifications.',
      });
    } else {
      toast({
        title: 'Permission denied',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: 'Settings reset',
      description: 'Notification preferences restored to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {!permissionGranted && (
        <Card className="border-primary/50 bg-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Enable Browser Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Allow notifications to get alerts even when the app is in the background
                  </p>
                </div>
              </div>
              <Button onClick={handleRequestPermission} variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timer Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Timer Notifications
          </CardTitle>
          <CardDescription>
            Get notified when your Pomodoro sessions and breaks are complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="timer-complete" className="flex flex-col gap-1">
              <span>Pomodoro Complete</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when a study session ends
              </span>
            </Label>
            <Switch
              id="timer-complete"
              checked={settings.timerComplete}
              onCheckedChange={(checked) => updateSetting('timerComplete', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="break-complete" className="flex flex-col gap-1">
              <span>Break Complete</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when a break ends
              </span>
            </Label>
            <Switch
              id="break-complete"
              checked={settings.breakComplete}
              onCheckedChange={(checked) => updateSetting('breakComplete', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="timer-sound" className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Timer Sound
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                Play a chime when timer completes
              </span>
            </Label>
            <Switch
              id="timer-sound"
              checked={settings.timerSound}
              onCheckedChange={(checked) => updateSetting('timerSound', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Challenge Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Challenge & Achievement Notifications
          </CardTitle>
          <CardDescription>
            Celebrate your progress with challenge and achievement notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-challenge" className="flex flex-col gap-1">
              <span>Daily Challenge Complete</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when you complete a daily challenge
              </span>
            </Label>
            <Switch
              id="daily-challenge"
              checked={settings.dailyChallengeComplete}
              onCheckedChange={(checked) => updateSetting('dailyChallengeComplete', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-challenge" className="flex flex-col gap-1">
              <span>Weekly Challenge Complete</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when you complete a weekly challenge
              </span>
            </Label>
            <Switch
              id="weekly-challenge"
              checked={settings.weeklyChallengeComplete}
              onCheckedChange={(checked) => updateSetting('weeklyChallengeComplete', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="achievement" className="flex flex-col gap-1">
              <span>Achievement Unlocked</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when you earn a new achievement
              </span>
            </Label>
            <Switch
              id="achievement"
              checked={settings.achievementUnlocked}
              onCheckedChange={(checked) => updateSetting('achievementUnlocked', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="challenge-sound" className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Challenge Sound
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                Play a fanfare when challenges/achievements complete
              </span>
            </Label>
            <Switch
              id="challenge-sound"
              checked={settings.challengeSound}
              onCheckedChange={(checked) => updateSetting('challengeSound', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Activity Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Room Activity Notifications
          </CardTitle>
          <CardDescription>
            Stay updated on what's happening in your study rooms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="member-joined" className="flex flex-col gap-1">
              <span>Member Joined</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when someone joins your room
              </span>
            </Label>
            <Switch
              id="member-joined"
              checked={settings.memberJoined}
              onCheckedChange={(checked) => updateSetting('memberJoined', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="member-left" className="flex flex-col gap-1">
              <span>Member Left</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when someone leaves your room
              </span>
            </Label>
            <Switch
              id="member-left"
              checked={settings.memberLeft}
              onCheckedChange={(checked) => updateSetting('memberLeft', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="timer-started" className="flex flex-col gap-1">
              <span>Timer Started by Others</span>
              <span className="text-sm text-muted-foreground font-normal">
                Notify when another member starts the room timer
              </span>
            </Label>
            <Switch
              id="timer-started"
              checked={settings.timerStartedByOthers}
              onCheckedChange={(checked) => updateSetting('timerStartedByOthers', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="activity-sound" className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Activity Sound
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                Play a subtle sound for room activity
              </span>
            </Label>
            <Switch
              id="activity-sound"
              checked={settings.activitySound}
              onCheckedChange={(checked) => updateSetting('activitySound', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
