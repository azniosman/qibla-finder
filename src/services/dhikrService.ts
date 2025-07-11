import { StorageService } from './storageService';
import * as Haptics from 'expo-haptics';

export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  target: number;
  category: 'tasbih' | 'tahmid' | 'takbir' | 'istighfar' | 'salawat' | 'dua' | 'custom';
  benefit?: string;
}

export interface DhikrSession {
  id: string;
  dhikrId: string;
  startTime: Date;
  endTime?: Date;
  count: number;
  target: number;
  completed: boolean;
}

export interface DhikrStats {
  totalSessions: number;
  totalCount: number;
  todayCount: number;
  weeklyCount: number;
  monthlyCount: number;
  averagePerSession: number;
  mostUsedDhikr: string;
  currentStreak: number;
  longestStreak: number;
}

export class DhikrService {
  private static instance: DhikrService;
  private storageService: StorageService;

  private readonly DEFAULT_DHIKR: DhikrItem[] = [
    {
      id: 'subhanallah',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhan Allah',
      translation: 'Glory be to Allah',
      count: 0,
      target: 33,
      category: 'tasbih',
      benefit: 'Glorifying Allah purifies the heart and brings peace to the soul.'
    },
    {
      id: 'alhamdulillah',
      arabic: 'الْحَمْدُ لِلَّهِ',
      transliteration: 'Alhamdulillah',
      translation: 'All praise is due to Allah',
      count: 0,
      target: 33,
      category: 'tahmid',
      benefit: 'Praising Allah increases gratitude and fills the heart with contentment.'
    },
    {
      id: 'allahu_akbar',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allahu Akbar',
      translation: 'Allah is the Greatest',
      count: 0,
      target: 34,
      category: 'takbir',
      benefit: 'Declaring Allah\'s greatness strengthens faith and provides protection.'
    },
    {
      id: 'astaghfirullah',
      arabic: 'أَسْتَغْفِرُ اللَّهَ',
      transliteration: 'Astaghfirullah',
      translation: 'I seek forgiveness from Allah',
      count: 0,
      target: 100,
      category: 'istighfar',
      benefit: 'Seeking forgiveness cleanses the soul and opens doors to Allah\'s mercy.'
    },
    {
      id: 'salawat',
      arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
      transliteration: 'Allahumma salli ala Muhammad',
      translation: 'O Allah, send blessings upon Muhammad',
      count: 0,
      target: 10,
      category: 'salawat',
      benefit: 'Sending blessings upon the Prophet brings Allah\'s blessings upon you.'
    },
    {
      id: 'la_hawla',
      arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
      transliteration: 'La hawla wa la quwwata illa billah',
      translation: 'There is no power except with Allah',
      count: 0,
      target: 10,
      category: 'dua',
      benefit: 'This phrase is a treasure from the treasures of Paradise.'
    },
    {
      id: 'la_ilaha_illa_allah',
      arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
      transliteration: 'La ilaha illa Allah',
      translation: 'There is no god but Allah',
      count: 0,
      target: 100,
      category: 'tasbih',
      benefit: 'The best dhikr that renews faith and brings the greatest reward.'
    },
    {
      id: 'hasbi_allah',
      arabic: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ',
      transliteration: 'Hasbi Allah wa ni\'ma al-wakil',
      translation: 'Allah is sufficient for me, and He is the best disposer of affairs',
      count: 0,
      target: 7,
      category: 'dua',
      benefit: 'Perfect for times of worry and anxiety, brings peace and trust in Allah.'
    }
  ];

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): DhikrService {
    if (!DhikrService.instance) {
      DhikrService.instance = new DhikrService();
    }
    return DhikrService.instance;
  }

  public async getDhikrList(): Promise<DhikrItem[]> {
    try {
      const savedDhikr = await this.storageService.getData('dhikr_list');
      if (savedDhikr && savedDhikr.length > 0) {
        return savedDhikr;
      }
      
      // Initialize with default dhikr if none exist
      await this.storageService.saveData('dhikr_list', this.DEFAULT_DHIKR);
      return this.DEFAULT_DHIKR;
    } catch (error) {
      console.error('Error loading dhikr list:', error);
      return this.DEFAULT_DHIKR;
    }
  }

  public async saveDhikrList(dhikrList: DhikrItem[]): Promise<void> {
    try {
      await this.storageService.saveData('dhikr_list', dhikrList);
    } catch (error) {
      console.error('Error saving dhikr list:', error);
      throw error;
    }
  }

  public async getDhikrById(id: string): Promise<DhikrItem | null> {
    const dhikrList = await this.getDhikrList();
    return dhikrList.find(dhikr => dhikr.id === id) || null;
  }

  public async updateDhikrCount(id: string, count: number): Promise<void> {
    try {
      const dhikrList = await this.getDhikrList();
      const dhikrIndex = dhikrList.findIndex(dhikr => dhikr.id === id);
      
      if (dhikrIndex !== -1 && dhikrList[dhikrIndex]) {
        dhikrList[dhikrIndex].count = count;
        await this.saveDhikrList(dhikrList);
      }
    } catch (error) {
      console.error('Error updating dhikr count:', error);
      throw error;
    }
  }

  public async resetDhikrCount(id: string): Promise<void> {
    await this.updateDhikrCount(id, 0);
  }

  public async resetAllCounts(): Promise<void> {
    try {
      const dhikrList = await this.getDhikrList();
      const resetList = dhikrList.map(dhikr => ({ ...dhikr, count: 0 }));
      await this.saveDhikrList(resetList);
    } catch (error) {
      console.error('Error resetting all counts:', error);
      throw error;
    }
  }

  public async incrementCount(id: string, hapticFeedback: boolean = true): Promise<number> {
    try {
      const dhikr = await this.getDhikrById(id);
      if (!dhikr) {
        throw new Error('Dhikr not found');
      }

      const newCount = dhikr.count + 1;
      await this.updateDhikrCount(id, newCount);

      // Provide haptic feedback
      if (hapticFeedback) {
        if (newCount % 33 === 0 || newCount === dhikr.target) {
          // Special milestone vibration
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (newCount % 10 === 0) {
          // Medium vibration for every 10
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          // Light vibration for each count
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      return newCount;
    } catch (error) {
      console.error('Error incrementing count:', error);
      throw error;
    }
  }

  public async startSession(dhikrId: string): Promise<DhikrSession> {
    try {
      const dhikr = await this.getDhikrById(dhikrId);
      if (!dhikr) {
        throw new Error('Dhikr not found');
      }

      const session: DhikrSession = {
        id: `session_${Date.now()}`,
        dhikrId,
        startTime: new Date(),
        count: 0,
        target: dhikr.target,
        completed: false
      };

      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  public async updateSession(session: DhikrSession): Promise<void> {
    try {
      await this.saveSession(session);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  public async completeSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex !== -1 && sessions[sessionIndex]) {
        sessions[sessionIndex].endTime = new Date();
        sessions[sessionIndex].completed = true;
        await this.storageService.saveData('dhikr_sessions', sessions);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  private async saveSession(session: DhikrSession): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex !== -1) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await this.storageService.saveData('dhikr_sessions', sessions);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  public async getSessions(): Promise<DhikrSession[]> {
    try {
      const sessions = await this.storageService.getData('dhikr_sessions');
      return sessions || [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  public async getStats(): Promise<DhikrStats> {
    try {
      const sessions = await this.getSessions();
      const dhikrList = await this.getDhikrList();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const completedSessions = sessions.filter(s => s.completed);
      const todaySessions = completedSessions.filter(s => 
        new Date(s.startTime) >= today
      );
      const weeklySessions = completedSessions.filter(s => 
        new Date(s.startTime) >= weekAgo
      );
      const monthlySessions = completedSessions.filter(s => 
        new Date(s.startTime) >= monthAgo
      );

      const totalCount = completedSessions.reduce((sum, s) => sum + s.count, 0);
      const todayCount = todaySessions.reduce((sum, s) => sum + s.count, 0);
      const weeklyCount = weeklySessions.reduce((sum, s) => sum + s.count, 0);
      const monthlyCount = monthlySessions.reduce((sum, s) => sum + s.count, 0);

      // Find most used dhikr
      const dhikrUsage = completedSessions.reduce((acc, session) => {
        acc[session.dhikrId] = (acc[session.dhikrId] || 0) + session.count;
        return acc;
      }, {} as Record<string, number>);

      const usageKeys = Object.keys(dhikrUsage);
      const mostUsedDhikrId = usageKeys.length > 0 
        ? usageKeys.reduce((a, b) => (dhikrUsage[a] || 0) > (dhikrUsage[b] || 0) ? a : b)
        : '';

      const mostUsedDhikr = mostUsedDhikrId 
        ? dhikrList.find(d => d.id === mostUsedDhikrId)?.transliteration || 'None'
        : 'None';

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateStreaks(completedSessions);

      return {
        totalSessions: completedSessions.length,
        totalCount,
        todayCount,
        weeklyCount,
        monthlyCount,
        averagePerSession: completedSessions.length > 0 ? Math.round(totalCount / completedSessions.length) : 0,
        mostUsedDhikr,
        currentStreak,
        longestStreak
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalSessions: 0,
        totalCount: 0,
        todayCount: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        averagePerSession: 0,
        mostUsedDhikr: 'None',
        currentStreak: 0,
        longestStreak: 0
      };
    }
  }

  private calculateStreaks(sessions: DhikrSession[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort sessions by date
    const sortedSessions = sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Group sessions by date
    const sessionsByDate = sortedSessions.reduce((acc, session) => {
      const dateKey = new Date(session.startTime).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {} as Record<string, DhikrSession[]>);

    const dates = Object.keys(sessionsByDate).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Calculate current streak (working backwards from today)
    if (sessionsByDate[today] || sessionsByDate[yesterday]) {
      let checkDate = sessionsByDate[today] ? today : yesterday;
      let currentDate = new Date(checkDate);
      
      while (sessionsByDate[currentDate.toDateString()]) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    // Calculate longest streak
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1] || '');
        const currentDate = new Date(dates[i] || '');
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  public async addCustomDhikr(dhikr: Omit<DhikrItem, 'id' | 'count'>): Promise<void> {
    try {
      const dhikrList = await this.getDhikrList();
      const newDhikr: DhikrItem = {
        ...dhikr,
        id: `custom_${Date.now()}`,
        count: 0,
        category: 'custom'
      };
      
      dhikrList.push(newDhikr);
      await this.saveDhikrList(dhikrList);
    } catch (error) {
      console.error('Error adding custom dhikr:', error);
      throw error;
    }
  }

  public async deleteDhikr(id: string): Promise<void> {
    try {
      const dhikrList = await this.getDhikrList();
      const filteredList = dhikrList.filter(dhikr => dhikr.id !== id);
      await this.saveDhikrList(filteredList);
    } catch (error) {
      console.error('Error deleting dhikr:', error);
      throw error;
    }
  }

  public async updateDhikrTarget(id: string, target: number): Promise<void> {
    try {
      const dhikrList = await this.getDhikrList();
      const dhikrIndex = dhikrList.findIndex(dhikr => dhikr.id === id);
      
      if (dhikrIndex !== -1 && dhikrList[dhikrIndex]) {
        dhikrList[dhikrIndex].target = target;
        await this.saveDhikrList(dhikrList);
      }
    } catch (error) {
      console.error('Error updating dhikr target:', error);
      throw error;
    }
  }

  public async exportData(): Promise<string> {
    try {
      const dhikrList = await this.getDhikrList();
      const sessions = await this.getSessions();
      const stats = await this.getStats();

      const exportData = {
        dhikrList,
        sessions,
        stats,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}