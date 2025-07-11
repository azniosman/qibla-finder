import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PrayerDay, 
  QadaCount, 
  QadaPlan, 
  AppSettings, 
  Location as LocationType,
  NotificationSettings 
} from '../types';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Storage service for handling local data persistence
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Prayer Records
  /**
   * Save prayer record for a specific date
   */
  async savePrayerRecord(date: string, prayerDay: PrayerDay): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.PRAYER_RECORDS}_${date}`;
      await AsyncStorage.setItem(key, JSON.stringify(prayerDay));
    } catch (error) {
      console.error('Error saving prayer record:', error);
      throw error;
    }
  }

  /**
   * Get prayer record for a specific date
   */
  async getPrayerRecord(date: string): Promise<PrayerDay | null> {
    try {
      const key = `${STORAGE_KEYS.PRAYER_RECORDS}_${date}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting prayer record:', error);
      return null;
    }
  }

  /**
   * Get prayer records for a date range
   */
  async getPrayerRecords(startDate: string, endDate: string): Promise<PrayerDay[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prayerKeys = keys.filter(key => 
        key.startsWith(STORAGE_KEYS.PRAYER_RECORDS) &&
        (key.split('_')[1] ?? '') >= startDate &&
        (key.split('_')[1] ?? '') <= endDate
      );

      const records = await AsyncStorage.multiGet(prayerKeys);
      return records
        .map(([_, value]) => value ? JSON.parse(value) : null)
        .filter((record): record is PrayerDay => record !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting prayer records:', error);
      return [];
    }
  }

  /**
   * Delete prayer record for a specific date
   */
  async deletePrayerRecord(date: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.PRAYER_RECORDS}_${date}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting prayer record:', error);
      throw error;
    }
  }

  // Qada Management
  /**
   * Save qada count
   */
  async saveQadaCount(qadaCount: QadaCount): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.QADA_COUNT, JSON.stringify(qadaCount));
    } catch (error) {
      console.error('Error saving qada count:', error);
      throw error;
    }
  }

  /**
   * Get qada count
   */
  async getQadaCount(): Promise<QadaCount | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.QADA_COUNT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting qada count:', error);
      return null;
    }
  }

  /**
   * Save qada plan
   */
  async saveQadaPlan(qadaPlan: QadaPlan): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.QADA_PLAN, JSON.stringify(qadaPlan));
    } catch (error) {
      console.error('Error saving qada plan:', error);
      throw error;
    }
  }

  /**
   * Get qada plan
   */
  async getQadaPlan(): Promise<QadaPlan | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.QADA_PLAN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting qada plan:', error);
      return null;
    }
  }

  // App Settings
  /**
   * Save app settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get app settings
   */
  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  // Location
  /**
   * Save user location
   */
  async saveLocation(location: LocationType): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  /**
   * Get saved location
   */
  async getLocation(): Promise<LocationType | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  // Notification Settings
  /**
   * Save notification settings
   */
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  // Utility Methods
  /**
   * Clear all app data
   */
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(STORAGE_KEYS).some(storageKey => key.startsWith(storageKey))
      );
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<string> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(STORAGE_KEYS).some(storageKey => key.startsWith(storageKey))
      );
      
      const data = await AsyncStorage.multiGet(appKeys);
      const exportData: Record<string, any> = {};
      
      data.forEach(([key, value]) => {
        if (value) {
          exportData[key] = JSON.parse(value);
        }
      });
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data from JSON
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      const entries: [string, string][] = Object.entries(data).map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ totalKeys: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(STORAGE_KEYS).some(storageKey => key.startsWith(storageKey))
      );
      
      const data = await AsyncStorage.multiGet(appKeys);
      const totalSize = data.reduce((size, [_, value]) => {
        return size + (value ? value.length : 0);
      }, 0);
      
      return {
        totalKeys: appKeys.length,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalKeys: 0, totalSize: 0 };
    }
  }

  // Generic data methods
  /**
   * Save generic data with a key
   */
  async saveData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get generic data by key
   */
  async getData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }
} 