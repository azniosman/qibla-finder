// Prayer types and interfaces
export interface Prayer {
  name: string;
  time: string;
  completed: boolean;
  loggedAt?: string;
  isQada?: boolean;
  qadaCount?: number;
  snoozedCount?: number;
}

export interface PrayerDay {
  date: string;
  prayers: {
    fajr: Prayer;
    dhuhr: Prayer;
    asr: Prayer;
    maghrib: Prayer;
    isha: Prayer;
  };
}

export interface QadaCount {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface QadaPlan {
  dailyTarget: number;
  priorityPrayer: keyof QadaCount;
  startDate: string;
  completedToday: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface QiblaDirection {
  bearing: number;
  distance: number;
  isCalibrated: boolean;
}

export interface AppSettings {
  calculationMethod: 'ISNA' | 'MWL' | 'Egypt' | 'Makkah' | 'Karachi';
  notificationSound: 'adhan1' | 'adhan2' | 'bell' | 'none';
  notificationAdvance: number; // minutes before prayer
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ar' | 'ms' | 'ur';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PrayerStats {
  totalPrayers: number;
  completedPrayers: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  missedPrayers: number;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  advanceMinutes: number;
  soundName: 'adhan1' | 'adhan2' | 'bell' | 'chime' | 'none' | 'default';
  allowSnooze: boolean;
  qadaReminders: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
} 