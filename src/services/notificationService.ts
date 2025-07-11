import * as Notifications from 'expo-notifications';
import { NotificationSettings } from '../types';
import { NOTIFICATION_DEFAULTS } from '../utils/constants';
import { StorageService } from './storageService';

/**
 * Notification service for handling prayer time alerts
 */
export class NotificationService {
  private static instance: NotificationService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Configure notification categories with actions
      await this.setupNotificationCategories();

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => {
          const settings = await this.getNotificationSettings();
          return {
            shouldShowAlert: true,
            shouldPlaySound: settings?.sound ?? true,
            shouldSetBadge: false,
          };
        },
      });

      // Setup notification response handlers
      this.setupNotificationResponseHandlers();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Schedule prayer time notification with custom sound
   */
  async schedulePrayerNotification(
    prayerName: string,
    prayerTime: string,
    advanceMinutes: number = NOTIFICATION_DEFAULTS.advanceMinutes,
    soundName: string = 'adhan1'
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const timeParts = prayerTime.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      const notificationTime = new Date();
      notificationTime.setHours(hours, (minutes ?? 0) - advanceMinutes, 0, 0);

      // If notification time has passed, schedule for tomorrow
      if (notificationTime <= new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerName} Prayer Time`,
          body: advanceMinutes > 0 
            ? `${prayerName} prayer is in ${advanceMinutes} minutes`
            : `It's time for ${prayerName} prayer`,
          data: { 
            prayerName, 
            prayerTime, 
            type: 'prayer_reminder',
            soundName,
            canSnooze: true
          },
          sound: this.getSoundFile(soundName),
          categoryIdentifier: 'PRAYER_REMINDER',
        },
        trigger: notificationTime,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling prayer notification:', error);
      return null;
    }
  }

  /**
   * Schedule qada reminder notification
   */
  async scheduleQadaReminder(
    qadaCount: number,
    targetDate: Date = new Date()
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Schedule for 9 AM on the target date
      const notificationTime = new Date(targetDate);
      notificationTime.setHours(9, 0, 0, 0);

      // If time has passed, schedule for tomorrow
      if (notificationTime <= new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Qada Prayer Reminder`,
          body: `You have ${qadaCount} missed prayers to make up. Set aside time for qada prayers today.`,
          data: { qadaCount, type: 'qada_reminder' },
          sound: 'default',
        },
        trigger: notificationTime,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling qada reminder:', error);
      return null;
    }
  }

  /**
   * Schedule daily prayer completion reminder
   */
  async scheduleDailyReminder(
    time: string = '21:00' // 9 PM default
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const timeParts = time.split(':').map(Number);
      const hours = timeParts[0] ?? 21;
      const minutes = timeParts[1] ?? 0;
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      // If time has passed, schedule for tomorrow
      if (notificationTime <= new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Daily Prayer Check`,
          body: `Don't forget to log your prayers for today!`,
          data: { type: 'daily_reminder' },
          sound: 'default',
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Schedule notifications for all prayers of the day
   */
  async scheduleDailyPrayerNotifications(
    prayerTimes: Record<string, string>,
    settings: NotificationSettings
  ): Promise<string[]> {
    try {
      const identifiers: string[] = [];

      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
        if (settings.enabled) {
          const identifier = await this.schedulePrayerNotification(
            prayerName,
            prayerTime,
            settings.advanceMinutes
          );
          if (identifier) {
            identifiers.push(identifier);
          }
        }
      }

      return identifiers;
    } catch (error) {
      console.error('Error scheduling daily prayer notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup notification categories with snooze actions
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('PRAYER_REMINDER', [
      {
        identifier: 'SNOOZE_5',
        buttonTitle: 'Snooze 5 min',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'SNOOZE_10',
        buttonTitle: 'Snooze 10 min',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'MARK_COMPLETED',
        buttonTitle: 'Mark Completed',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  /**
   * Setup notification response handlers
   */
  private setupNotificationResponseHandlers(): void {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const { prayerName, prayerTime } = notification.request.content.data;

      switch (actionIdentifier) {
        case 'SNOOZE_5':
          await this.snoozeNotification(prayerName, prayerTime, 5);
          break;
        case 'SNOOZE_10':
          await this.snoozeNotification(prayerName, prayerTime, 10);
          break;
        case 'MARK_COMPLETED':
          await this.markPrayerCompleted(prayerName);
          break;
      }
    });
  }

  /**
   * Snooze a prayer notification
   */
  async snoozeNotification(
    prayerName: string,
    prayerTime: string,
    snoozeMinutes: number
  ): Promise<void> {
    try {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerName} Prayer Reminder (Snoozed)`,
          body: `Reminder: ${prayerName} prayer time was ${prayerTime}`,
          data: { 
            prayerName, 
            prayerTime, 
            type: 'prayer_snooze',
            snoozed: true
          },
          sound: 'default',
          categoryIdentifier: 'PRAYER_REMINDER',
        },
        trigger: snoozeTime,
      });
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  }

  /**
   * Mark prayer as completed from notification
   */
  private async markPrayerCompleted(prayerName: string): Promise<void> {
    try {
      const storageService = StorageService.getInstance();
      const today = new Date().toISOString().split('T')[0] || '';
      let prayerDay = await storageService.getPrayerRecord(today);

      if (prayerDay) {
        const prayer = prayerDay.prayers[prayerName as keyof typeof prayerDay.prayers];
        if (prayer) {
          prayer.completed = true;
          prayer.loggedAt = new Date().toISOString();
          await storageService.savePrayerRecord(today, prayerDay);
        }
      }
    } catch (error) {
      console.error('Error marking prayer completed:', error);
    }
  }

  /**
   * Get sound file based on setting
   */
  private getSoundFile(soundName: string): string {
    const soundMap: Record<string, string> = {
      'adhan1': 'adhan1.mp3',
      'adhan2': 'adhan2.mp3',
      'bell': 'bell.mp3',
      'chime': 'chime.mp3',
      'none': undefined as any,
      'default': 'default',
    };
    return soundMap[soundName] || 'default';
  }

  /**
   * Get notification settings
   */
  private async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const storageService = StorageService.getInstance();
      return await storageService.getNotificationSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  /**
   * Send immediate notification (for testing)
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  /**
   * Set notification sound
   */
  async setNotificationSound(sound: string): Promise<void> {
    try {
      // This would typically involve setting up custom sounds
      // For now, we'll use the default sound system
      console.log('Setting notification sound:', sound);
    } catch (error) {
      console.error('Error setting notification sound:', error);
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  setNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Handle notification response (when user taps notification)
   */
  setNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
} 