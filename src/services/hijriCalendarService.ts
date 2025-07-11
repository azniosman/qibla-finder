import { StorageService } from './storageService';

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  dayName: string;
  weekday: number;
}

export interface IslamicEvent {
  id: string;
  title: string;
  description: string;
  date: HijriDate;
  gregorianDate: Date;
  type: 'holiday' | 'observance' | 'commemoration';
  significance: string;
}

export class HijriCalendarService {
  private static instance: HijriCalendarService;
  private storageService: StorageService;

  private readonly HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
    'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
  ];

  private readonly WEEKDAYS = [
    'Al-Ahad', 'Al-Ithnayn', 'Al-Thulatha', 'Al-Arbia',
    'Al-Khamis', 'Al-Jumua', 'As-Sabt'
  ];

  private readonly ISLAMIC_EVENTS: Omit<IslamicEvent, 'gregorianDate'>[] = [
    {
      id: 'new_year',
      title: 'Islamic New Year',
      description: 'Beginning of the new Hijri year',
      date: { day: 1, month: 1, year: 1446, monthName: 'Muharram', dayName: 'Al-Ahad', weekday: 0 },
      type: 'holiday',
      significance: 'Marks the beginning of the Islamic calendar and commemorates the Hijra (migration) of Prophet Muhammad (PBUH) from Mecca to Medina.'
    },
    {
      id: 'ashura',
      title: 'Day of Ashura',
      description: 'The 10th day of Muharram',
      date: { day: 10, month: 1, year: 1446, monthName: 'Muharram', dayName: 'Al-Ithnayn', weekday: 1 },
      type: 'observance',
      significance: 'A day of fasting and remembrance, commemorating the day Allah saved Moses and the Israelites from Pharaoh.'
    },
    {
      id: 'mawlid',
      title: 'Mawlid an-Nabi',
      description: 'Birthday of Prophet Muhammad (PBUH)',
      date: { day: 12, month: 3, year: 1446, monthName: 'Rabi al-Awwal', dayName: 'Al-Jumua', weekday: 5 },
      type: 'commemoration',
      significance: 'Celebrates the birth of Prophet Muhammad (PBUH) and reflects on his teachings and example.'
    },
    {
      id: 'isra_miraj',
      title: 'Isra and Mi\'raj',
      description: 'The Night Journey and Ascension',
      date: { day: 27, month: 7, year: 1446, monthName: 'Rajab', dayName: 'Al-Khamis', weekday: 4 },
      type: 'commemoration',
      significance: 'Commemorates the miraculous night journey of Prophet Muhammad (PBUH) from Mecca to Jerusalem and his ascension to heaven.'
    },
    {
      id: 'laylat_qadr',
      title: 'Laylat al-Qadr',
      description: 'The Night of Power',
      date: { day: 27, month: 9, year: 1446, monthName: 'Ramadan', dayName: 'Al-Arbia', weekday: 3 },
      type: 'observance',
      significance: 'The night when the first verses of the Quran were revealed. It is better than a thousand months.'
    },
    {
      id: 'eid_fitr',
      title: 'Eid al-Fitr',
      description: 'Festival of Breaking the Fast',
      date: { day: 1, month: 10, year: 1446, monthName: 'Shawwal', dayName: 'Al-Ithnayn', weekday: 1 },
      type: 'holiday',
      significance: 'Celebrates the end of Ramadan, the month of fasting. A time of joy, charity, and community gathering.'
    },
    {
      id: 'eid_adha',
      title: 'Eid al-Adha',
      description: 'Festival of Sacrifice',
      date: { day: 10, month: 12, year: 1446, monthName: 'Dhu al-Hijjah', dayName: 'As-Sabt', weekday: 6 },
      type: 'holiday',
      significance: 'Commemorates Ibrahim\'s willingness to sacrifice his son as an act of obedience to Allah. Coincides with Hajj pilgrimage.'
    },
    {
      id: 'arafat',
      title: 'Day of Arafat',
      description: 'The most important day of Hajj',
      date: { day: 9, month: 12, year: 1446, monthName: 'Dhu al-Hijjah', dayName: 'Al-Jumua', weekday: 5 },
      type: 'observance',
      significance: 'The day when pilgrims gather at Mount Arafat. A day of forgiveness and mercy for all Muslims.'
    }
  ];

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): HijriCalendarService {
    if (!HijriCalendarService.instance) {
      HijriCalendarService.instance = new HijriCalendarService();
    }
    return HijriCalendarService.instance;
  }

  public getCurrentHijriDate(): HijriDate {
    const gregorianDate = new Date();
    return this.gregorianToHijri(gregorianDate);
  }

  public gregorianToHijri(gregorianDate: Date): HijriDate {
    // Simplified Hijri conversion algorithm
    // Note: For production, consider using a more accurate algorithm or API
    const HIJRI_EPOCH = new Date('622-07-16'); // July 16, 622 CE
    const daysDifference = Math.floor((gregorianDate.getTime() - HIJRI_EPOCH.getTime()) / (1000 * 60 * 60 * 24));
    
    // Approximate calculation (Hijri year is about 354.37 days)
    const hijriYear = Math.floor(daysDifference / 354.37) + 1;
    const remainingDays = daysDifference % 354.37;
    
    // Approximate month calculation (average 29.53 days per month)
    const hijriMonth = Math.floor(remainingDays / 29.53) + 1;
    const hijriDay = Math.floor(remainingDays % 29.53) + 1;

    const monthIndex = Math.min(Math.max(hijriMonth - 1, 0), 11);
    const weekday = gregorianDate.getDay();

    return {
      day: Math.max(hijriDay, 1),
      month: Math.max(hijriMonth, 1),
      year: Math.max(hijriYear, 1),
      monthName: this.HIJRI_MONTHS[monthIndex] || 'Muharram',
      dayName: this.WEEKDAYS[weekday] || 'Al-Ahad',
      weekday
    };
  }

  public hijriToGregorian(hijriDate: HijriDate): Date {
    // Simplified conversion back to Gregorian
    const HIJRI_EPOCH = new Date('622-07-16');
    const totalDays = (hijriDate.year - 1) * 354.37 + (hijriDate.month - 1) * 29.53 + (hijriDate.day - 1);
    
    return new Date(HIJRI_EPOCH.getTime() + totalDays * 24 * 60 * 60 * 1000);
  }

  public getIslamicEvents(year?: number): IslamicEvent[] {
    const currentYear = year || this.getCurrentHijriDate().year;
    
    return this.ISLAMIC_EVENTS.map(event => ({
      ...event,
      date: { ...event.date, year: currentYear },
      gregorianDate: this.hijriToGregorian({ ...event.date, year: currentYear })
    }));
  }

  public getUpcomingEvents(limit: number = 5): IslamicEvent[] {
    const today = new Date();
    const currentYear = this.getCurrentHijriDate().year;
    const thisYearEvents = this.getIslamicEvents(currentYear);
    const nextYearEvents = this.getIslamicEvents(currentYear + 1);
    
    const allEvents = [...thisYearEvents, ...nextYearEvents];
    
    return allEvents
      .filter(event => event.gregorianDate >= today)
      .sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime())
      .slice(0, limit);
  }

  public getEventsByMonth(hijriMonth: number, hijriYear: number): IslamicEvent[] {
    const events = this.getIslamicEvents(hijriYear);
    return events.filter(event => event.date.month === hijriMonth);
  }

  public isRamadan(date?: Date): boolean {
    const hijriDate = date ? this.gregorianToHijri(date) : this.getCurrentHijriDate();
    return hijriDate.month === 9; // Ramadan is the 9th month
  }

  public isDhuAlHijjah(date?: Date): boolean {
    const hijriDate = date ? this.gregorianToHijri(date) : this.getCurrentHijriDate();
    return hijriDate.month === 12; // Dhu al-Hijjah is the 12th month
  }

  public getRamadanDates(year: number): { start: Date; end: Date } {
    const ramadanStart = this.hijriToGregorian({ day: 1, month: 9, year, monthName: 'Ramadan', dayName: '', weekday: 0 });
    const ramadanEnd = this.hijriToGregorian({ day: 29, month: 9, year, monthName: 'Ramadan', dayName: '', weekday: 0 });
    
    return { start: ramadanStart, end: ramadanEnd };
  }

  public getMonthName(monthNumber: number): string {
    const month = this.HIJRI_MONTHS[monthNumber - 1];
    return month || '';
  }

  public getDayName(weekday: number): string {
    const day = this.WEEKDAYS[weekday];
    return day || '';
  }

  public formatHijriDate(hijriDate: HijriDate, includeWeekday: boolean = true): string {
    const weekdayPart = includeWeekday ? `${hijriDate.dayName}, ` : '';
    return `${weekdayPart}${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} AH`;
  }

  public async saveCustomEvent(event: Omit<IslamicEvent, 'id' | 'gregorianDate'>): Promise<void> {
    try {
      const events = await this.getCustomEvents();
      const newEvent: IslamicEvent = {
        ...event,
        id: `custom_${Date.now()}`,
        gregorianDate: this.hijriToGregorian(event.date)
      };
      
      events.push(newEvent);
      await this.storageService.saveData('custom_islamic_events', events);
    } catch (error) {
      console.error('Error saving custom event:', error);
      throw error;
    }
  }

  public async getCustomEvents(): Promise<IslamicEvent[]> {
    try {
      return await this.storageService.getData('custom_islamic_events') || [];
    } catch (error) {
      console.error('Error loading custom events:', error);
      return [];
    }
  }

  public async deleteCustomEvent(eventId: string): Promise<void> {
    try {
      const events = await this.getCustomEvents();
      const updatedEvents = events.filter(event => event.id !== eventId);
      await this.storageService.saveData('custom_islamic_events', updatedEvents);
    } catch (error) {
      console.error('Error deleting custom event:', error);
      throw error;
    }
  }
}