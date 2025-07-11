import { QadaCount, QadaPlan, PrayerDay } from '../types';
import { StorageService } from './storageService';
import { NotificationService } from './notificationService';
import { PRAYER_ORDER } from '../utils/constants';

/**
 * Qada (missed prayer) management service
 */
export class QadaService {
  private static instance: QadaService;

  private constructor() {}

  static getInstance(): QadaService {
    if (!QadaService.instance) {
      QadaService.instance = new QadaService();
    }
    return QadaService.instance;
  }

  /**
   * Get current qada count
   */
  async getQadaCount(): Promise<QadaCount> {
    try {
      const storageService = StorageService.getInstance();
      const qadaCount = await storageService.getQadaCount();
      
      if (!qadaCount) {
        return {
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
        };
      }
      
      return qadaCount;
    } catch (error) {
      console.error('Error getting qada count:', error);
      return {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      };
    }
  }

  /**
   * Update qada count for a specific prayer
   */
  async updateQadaCount(
    prayerName: keyof QadaCount,
    increment: number
  ): Promise<void> {
    try {
      const storageService = StorageService.getInstance();
      const currentCount = await this.getQadaCount();
      
      currentCount[prayerName] = Math.max(0, currentCount[prayerName] + increment);
      
      await storageService.saveQadaCount(currentCount);
    } catch (error) {
      console.error('Error updating qada count:', error);
      throw error;
    }
  }

  /**
   * Automatically increment qada count for missed prayers
   */
  async processEndOfDay(): Promise<void> {
    try {
      const storageService = StorageService.getInstance();
      const today = new Date().toISOString().split('T')[0] || '';
      const prayerDay = await storageService.getPrayerRecord(today);
      
      if (!prayerDay) return;
      
      for (const prayerName of PRAYER_ORDER) {
        const prayer = prayerDay.prayers[prayerName as keyof typeof prayerDay.prayers];
        
        if (!prayer.completed && !prayer.isQada) {
          // Prayer was missed, increment qada count
          await this.updateQadaCount(prayerName as keyof QadaCount, 1);
        }
      }
    } catch (error) {
      console.error('Error processing end of day qada:', error);
    }
  }

  /**
   * Get qada plan
   */
  async getQadaPlan(): Promise<QadaPlan | null> {
    try {
      const storageService = StorageService.getInstance();
      return await storageService.getQadaPlan();
    } catch (error) {
      console.error('Error getting qada plan:', error);
      return null;
    }
  }

  /**
   * Create or update qada plan
   */
  async saveQadaPlan(plan: QadaPlan): Promise<void> {
    try {
      const storageService = StorageService.getInstance();
      await storageService.saveQadaPlan(plan);
      
      // Schedule reminders for qada plan
      await this.scheduleQadaReminders(plan);
    } catch (error) {
      console.error('Error saving qada plan:', error);
      throw error;
    }
  }

  /**
   * Log a qada prayer completion
   */
  async logQadaPrayer(
    prayerName: keyof QadaCount,
    count: number = 1
  ): Promise<void> {
    try {
      // Decrease qada count
      await this.updateQadaCount(prayerName, -count);
      
      // Update qada plan progress
      const plan = await this.getQadaPlan();
      if (plan) {
        plan.completedToday += count;
        await this.saveQadaPlan(plan);
      }
      
      // Log in today's prayer record as qada
      await this.logQadaInPrayerRecord(prayerName, count);
    } catch (error) {
      console.error('Error logging qada prayer:', error);
      throw error;
    }
  }

  /**
   * Log qada prayer in daily prayer record
   */
  private async logQadaInPrayerRecord(
    prayerName: keyof QadaCount,
    count: number
  ): Promise<void> {
    try {
      const storageService = StorageService.getInstance();
      const today = new Date().toISOString().split('T')[0] || '';
      let prayerDay = await storageService.getPrayerRecord(today);
      
      if (!prayerDay) {
        // Create minimal prayer day record for qada logging
        prayerDay = {
          date: today,
          prayers: {
            fajr: { name: 'Fajr', time: '', completed: false },
            dhuhr: { name: 'Dhuhr', time: '', completed: false },
            asr: { name: 'Asr', time: '', completed: false },
            maghrib: { name: 'Maghrib', time: '', completed: false },
            isha: { name: 'Isha', time: '', completed: false },
          },
        };
      }
      
      // Add qada information to the prayer record
      const prayer = prayerDay.prayers[prayerName];
      if (prayer) {
        prayer.isQada = true;
        prayer.completed = true;
        prayer.loggedAt = new Date().toISOString();
        prayer.qadaCount = (prayer.qadaCount || 0) + count;
      }
      
      await storageService.savePrayerRecord(today, prayerDay);
    } catch (error) {
      console.error('Error logging qada in prayer record:', error);
    }
  }

  /**
   * Calculate total qada prayers
   */
  async getTotalQadaCount(): Promise<number> {
    const qadaCount = await this.getQadaCount();
    return Object.values(qadaCount).reduce((total, count) => total + count, 0);
  }

  /**
   * Get qada statistics
   */
  async getQadaStatistics(): Promise<{
    totalQada: number;
    completedThisWeek: number;
    completedThisMonth: number;
    averagePerDay: number;
    priorityPrayer: keyof QadaCount | null;
  }> {
    try {
      const qadaCount = await this.getQadaCount();
      const totalQada = await this.getTotalQadaCount();
      
      // Find priority prayer (highest count)
      let priorityPrayer: keyof QadaCount | null = null;
      let maxCount = 0;
      
      for (const [prayer, count] of Object.entries(qadaCount)) {
        if (count > maxCount) {
          maxCount = count;
          priorityPrayer = prayer as keyof QadaCount;
        }
      }
      
      // Calculate completion statistics (simplified for now)
      const plan = await this.getQadaPlan();
      const dailyTarget = plan?.dailyTarget || 1;
      
      return {
        totalQada,
        completedThisWeek: plan?.completedToday || 0, // Simplified
        completedThisMonth: plan?.completedToday || 0, // Simplified
        averagePerDay: dailyTarget,
        priorityPrayer,
      };
    } catch (error) {
      console.error('Error getting qada statistics:', error);
      return {
        totalQada: 0,
        completedThisWeek: 0,
        completedThisMonth: 0,
        averagePerDay: 0,
        priorityPrayer: null,
      };
    }
  }

  /**
   * Schedule qada reminders
   */
  private async scheduleQadaReminders(plan: QadaPlan): Promise<void> {
    try {
      const notificationService = NotificationService.getInstance();
      
      // Schedule daily qada reminder
      await notificationService.scheduleQadaReminder(
        await this.getTotalQadaCount()
      );
    } catch (error) {
      console.error('Error scheduling qada reminders:', error);
    }
  }

  /**
   * Generate recommended qada plan
   */
  async generateRecommendedPlan(): Promise<QadaPlan> {
    const qadaCount = await this.getQadaCount();
    const totalQada = await this.getTotalQadaCount();
    
    // Find prayer with highest count as priority
    let priorityPrayer: keyof QadaCount = 'fajr';
    let maxCount = 0;
    
    for (const [prayer, count] of Object.entries(qadaCount)) {
      if (count > maxCount) {
        maxCount = count;
        priorityPrayer = prayer as keyof QadaCount;
      }
    }
    
    // Calculate reasonable daily target
    let dailyTarget = 1;
    if (totalQada > 100) {
      dailyTarget = 3;
    } else if (totalQada > 50) {
      dailyTarget = 2;
    }
    
    return {
      dailyTarget,
      priorityPrayer,
      startDate: new Date().toISOString().split('T')[0] || '',
      completedToday: 0,
    };
  }

  /**
   * Reset daily qada progress
   */
  async resetDailyProgress(): Promise<void> {
    try {
      const plan = await this.getQadaPlan();
      if (plan) {
        plan.completedToday = 0;
        await this.saveQadaPlan(plan);
      }
    } catch (error) {
      console.error('Error resetting daily qada progress:', error);
    }
  }
}