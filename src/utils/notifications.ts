import { getNotificationSettings } from '@/hooks/useNotificationSettings';

// Timer notification sound using Web Audio API
export const playTimerSound = () => {
  const settings = getNotificationSettings();
  if (!settings.timerSound) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant chime sound
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    
    // Play a pleasant three-note chime
    playNote(523.25, now, 0.3);        // C5
    playNote(659.25, now + 0.15, 0.3); // E5
    playNote(783.99, now + 0.3, 0.5);  // G5
    
  } catch (error) {
    console.log('Could not play timer sound:', error);
  }
};

// Achievement/challenge completion sound
export const playChallengeSound = () => {
  const settings = getNotificationSettings();
  if (!settings.challengeSound) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    
    // Play a triumphant fanfare
    playNote(523.25, now, 0.15);        // C5
    playNote(659.25, now + 0.1, 0.15);  // E5
    playNote(783.99, now + 0.2, 0.15);  // G5
    playNote(1046.50, now + 0.3, 0.4);  // C6
    
  } catch (error) {
    console.log('Could not play challenge sound:', error);
  }
};

// Subtle notification sound for room activity
export const playActivitySound = () => {
  const settings = getNotificationSettings();
  if (!settings.activitySound) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
  } catch (error) {
    console.log('Could not play activity sound:', error);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
  }
  return false;
};

// Check if notifications are supported and granted
export const canShowNotifications = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

// Show browser notification with optional sound
export const showNotification = (
  title: string, 
  body: string, 
  options?: { 
    playSound?: 'timer' | 'challenge' | 'activity' | 'none';
    tag?: string;
    requireInteraction?: boolean;
  }
) => {
  const { playSound = 'none', tag, requireInteraction = false } = options || {};
  
  // Play sound based on type
  switch (playSound) {
    case 'timer':
      playTimerSound();
      break;
    case 'challenge':
      playChallengeSound();
      break;
    case 'activity':
      playActivitySound();
      break;
  }
  
  // Show browser notification
  if (canShowNotifications()) {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag,
      requireInteraction,
    });
  }
};

// Notification helper functions for specific events
export const notifyTimerComplete = (isBreak: boolean) => {
  const settings = getNotificationSettings();
  
  if (isBreak) {
    if (!settings.breakComplete) return;
    showNotification('⚡ Break Over!', 'Time to get back to studying!', { 
      playSound: 'timer',
      tag: 'timer-event'
    });
  } else {
    if (!settings.timerComplete) return;
    showNotification('🎉 Pomodoro Complete!', 'Great work! Take a well-deserved break.', { 
      playSound: 'timer',
      tag: 'timer-event'
    });
  }
};

export const notifyChallengeComplete = (challengeName: string, xpReward: number, isWeekly: boolean = false) => {
  const settings = getNotificationSettings();
  
  if (isWeekly && !settings.weeklyChallengeComplete) return;
  if (!isWeekly && !settings.dailyChallengeComplete) return;
  
  const emoji = isWeekly ? '🏆' : '🎯';
  const type = isWeekly ? 'Weekly' : 'Daily';
  showNotification(
    `${emoji} ${type} Challenge Complete!`, 
    `"${challengeName}" - +${xpReward} XP`,
    { playSound: 'challenge', tag: 'challenge-complete' }
  );
};

export const notifyAchievementUnlocked = (achievementName: string, xpReward: number) => {
  const settings = getNotificationSettings();
  if (!settings.achievementUnlocked) return;
  
  showNotification(
    '🏅 Achievement Unlocked!',
    `${achievementName} - +${xpReward} XP`,
    { playSound: 'challenge', tag: 'achievement' }
  );
};

export const notifyRoomActivity = (type: 'member_joined' | 'member_left' | 'new_message' | 'timer_started', details: string) => {
  const settings = getNotificationSettings();
  
  // Check individual settings for each type
  if (type === 'member_joined' && !settings.memberJoined) return;
  if (type === 'member_left' && !settings.memberLeft) return;
  if (type === 'timer_started' && !settings.timerStartedByOthers) return;
  
  const titles: Record<typeof type, string> = {
    member_joined: '👋 New Member!',
    member_left: '👋 Member Left',
    new_message: '💬 New Message',
    timer_started: '⏱️ Timer Started',
  };
  
  showNotification(titles[type], details, { 
    playSound: 'activity',
    tag: `room-${type}`
  });
};
