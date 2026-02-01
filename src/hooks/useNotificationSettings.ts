import { useState, useEffect } from 'react';

export interface NotificationSettings {
  // Timer notifications
  timerComplete: boolean;
  breakComplete: boolean;
  timerSound: boolean;
  
  // Challenge notifications
  dailyChallengeComplete: boolean;
  weeklyChallengeComplete: boolean;
  achievementUnlocked: boolean;
  challengeSound: boolean;
  
  // Room activity notifications
  memberJoined: boolean;
  memberLeft: boolean;
  timerStartedByOthers: boolean;
  activitySound: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  timerComplete: true,
  breakComplete: true,
  timerSound: true,
  dailyChallengeComplete: true,
  weeklyChallengeComplete: true,
  achievementUnlocked: true,
  challengeSound: true,
  memberJoined: true,
  memberLeft: false,
  timerStartedByOthers: true,
  activitySound: true,
};

const STORAGE_KEY = 'notification-settings';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return { settings, updateSetting, resetToDefaults };
};

// Standalone getter for use in notification utilities
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error);
  }
  return DEFAULT_SETTINGS;
};
