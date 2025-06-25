// Prayer names and times
export const PRAYER_NAMES = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
} as const;

export const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

// Color scheme
export const COLORS = {
  primary: '#2E7D32', // Islamic Green
  secondary: '#FFA726', // Warm Orange
  background: '#FAFAFA', // Light Gray
  surface: '#FFFFFF', // White
  textPrimary: '#212121', // Dark Gray
  textSecondary: '#757575', // Medium Gray
  accent: '#1976D2', // Prayer Blue
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  completed: '#4CAF50', // Green for completed prayers
  pending: '#FF9800', // Orange for pending prayers
  missed: '#F44336', // Red for missed prayers
} as const;

// Kaaba coordinates (Mecca)
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

// Calculation methods
export const CALCULATION_METHODS = {
  ISNA: 'Islamic Society of North America',
  MWL: 'Muslim World League',
  Egypt: 'Egyptian General Authority of Survey',
  Makkah: 'Umm Al-Qura University, Makkah',
  Karachi: 'University of Islamic Sciences, Karachi',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  PRAYER_RECORDS: 'prayer_records',
  QADA_COUNT: 'qada_count',
  QADA_PLAN: 'qada_plan',
  SETTINGS: 'app_settings',
  LOCATION: 'user_location',
  NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

// Notification settings
export const NOTIFICATION_DEFAULTS = {
  advanceMinutes: 15,
  sound: true,
  vibration: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
  },
} as const;

// Compass settings
export const COMPASS_SETTINGS = {
  updateInterval: 100, // ms
  calibrationThreshold: 5, // degrees
  vibrationThreshold: 3, // degrees from qibla
} as const;

// Prayer time calculation parameters
export const PRAYER_CALCULATION_PARAMS = {
  ISNA: {
    fajr: 15,
    isha: 15,
  },
  MWL: {
    fajr: 18,
    isha: 17,
  },
  Egypt: {
    fajr: 19.5,
    isha: 17.5,
  },
  Makkah: {
    fajr: 18.5,
    isha: 90,
  },
  Karachi: {
    fajr: 18,
    isha: 18,
  },
} as const; 