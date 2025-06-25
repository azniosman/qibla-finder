import * as Notifications from 'expo-notifications';
import { NotificationSettings } from '../types';
import { NOTIFICATION_DEFAULTS } from '../utils/constants';

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

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Schedule prayer time notification
   */
  async schedulePrayerNotification(
    prayerName: string,
    prayerTime: string,
    advanceMinutes: number = NOTIFICATION_DEFAULTS.advanceMinutes
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
          title: `Prayer Time Reminder`,
          body: `${prayerName} prayer is in ${advanceMinutes} minutes`,
          data: { prayerName, prayerTime, type: 'prayer_reminder' },
          sound: 'adhan.mp3', // Custom adhan sound
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