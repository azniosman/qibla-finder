import { Location, PrayerTimes } from '../types';
import { KAABA_COORDINATES, PRAYER_CALCULATION_PARAMS } from './constants';

/**
 * Calculate prayer times using astronomical formulas
 * Based on the calculation method specified
 */
export class PrayerCalculator {
  private latitude: number;
  private longitude: number;
  private timezone: number;
  private calculationMethod: keyof typeof PRAYER_CALCULATION_PARAMS;

  constructor(
    location: Location,
    timezone: number,
    calculationMethod: keyof typeof PRAYER_CALCULATION_PARAMS = 'ISNA'
  ) {
    this.latitude = location.latitude;
    this.longitude = location.longitude;
    this.timezone = timezone;
    this.calculationMethod = calculationMethod;
  }

  /**
   * Calculate prayer times for a specific date
   */
  calculatePrayerTimes(date: Date = new Date()): PrayerTimes {
    const julianDate = this.getJulianDate(date);
    const solarNoon = this.getSolarNoon(julianDate);
    const sunrise = this.getSunrise(julianDate);
    const sunset = this.getSunset(julianDate);

    const params = PRAYER_CALCULATION_PARAMS[this.calculationMethod];
    
    const fajr = this.getFajrTime(sunrise, params.fajr);
    const isha = this.getIshaTime(sunset, params.isha);
    const dhuhr = this.getDhuhrTime(solarNoon);
    const asr = this.getAsrTime(solarNoon);
    const maghrib = this.getMaghribTime(sunset);

    return {
      fajr: this.formatTime(fajr),
      sunrise: this.formatTime(sunrise),
      dhuhr: this.formatTime(dhuhr),
      asr: this.formatTime(asr),
      maghrib: this.formatTime(maghrib),
      isha: this.formatTime(isha),
    };
  }

  /**
   * Calculate qibla direction from current location to Kaaba
   */
  calculateQiblaDirection(): { bearing: number; distance: number } {
    const lat1 = this.toRadians(this.latitude);
    const lon1 = this.toRadians(this.longitude);
    const lat2 = this.toRadians(KAABA_COORDINATES.latitude);
    const lon2 = this.toRadians(KAABA_COORDINATES.longitude);

    // Calculate bearing
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let bearing = this.toDegrees(Math.atan2(y, x));
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;

    // Calculate distance using Haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius in km

    return { bearing, distance };
  }

  /**
   * Get Julian Date for a given date
   */
  private getJulianDate(date: Date): number {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (month <= 2) {
      year--;
      month += 12;
    }
    
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    
    return Math.floor(365.25 * (year + 4716)) +
           Math.floor(30.6001 * (month + 1)) +
           day + b - 1524.5;
  }

  /**
   * Calculate solar noon time
   */
  private getSolarNoon(julianDate: number): number {
    const n = julianDate - 2451545.0 + 0.0008;
    const j_star = n - this.longitude / 360;
    const m = 357.529 + 0.98560028 * j_star;
    const c = 1.9148 * Math.sin(this.toRadians(m)) +
              0.0200 * Math.sin(this.toRadians(2 * m)) +
              0.0003 * Math.sin(this.toRadians(3 * m));
    const l = 280.466 + 0.98564736 * j_star + c;
    const r = 2451545.0 + j_star + 0.0053 * Math.sin(this.toRadians(m)) -
              0.0069 * Math.sin(this.toRadians(2 * l));
    
    return r;
  }

  /**
   * Calculate sunrise time
   */
  private getSunrise(julianDate: number): number {
    const solarNoon = this.getSolarNoon(julianDate);
    const h0 = -0.83; // Sun elevation at sunrise
    const phi = this.toRadians(this.latitude);
    const delta = this.getSolarDeclination(julianDate);
    
    const cosH = (Math.sin(this.toRadians(h0)) - Math.sin(phi) * Math.sin(delta)) /
                 (Math.cos(phi) * Math.cos(delta));
    
    if (cosH > 1 || cosH < -1) {
      // No sunrise/sunset (polar day/night)
      return solarNoon;
    }
    
    const h = this.toDegrees(Math.acos(cosH));
    const sunrise = solarNoon - h / 360;
    
    return sunrise;
  }

  /**
   * Calculate sunset time
   */
  private getSunset(julianDate: number): number {
    const solarNoon = this.getSolarNoon(julianDate);
    const h0 = -0.83; // Sun elevation at sunset
    const phi = this.toRadians(this.latitude);
    const delta = this.getSolarDeclination(julianDate);
    
    const cosH = (Math.sin(this.toRadians(h0)) - Math.sin(phi) * Math.sin(delta)) /
                 (Math.cos(phi) * Math.cos(delta));
    
    if (cosH > 1 || cosH < -1) {
      // No sunrise/sunset (polar day/night)
      return solarNoon;
    }
    
    const h = this.toDegrees(Math.acos(cosH));
    const sunset = solarNoon + h / 360;
    
    return sunset;
  }

  /**
   * Get solar declination
   */
  private getSolarDeclination(julianDate: number): number {
    const n = julianDate - 2451545.0;
    const l = 280.460 + 0.9856474 * n;
    const g = 357.528 + 0.9856003 * n;
    const lambda = l + 1.915 * Math.sin(this.toRadians(g)) + 0.020 * Math.sin(this.toRadians(2 * g));
    const epsilon = 23.439 - 0.0000004 * n;
    
    return this.toRadians(Math.asin(Math.sin(this.toRadians(epsilon)) * Math.sin(this.toRadians(lambda))));
  }

  /**
   * Calculate Fajr time
   */
  private getFajrTime(sunrise: number, angle: number): number {
    const phi = this.toRadians(this.latitude);
    const delta = this.getSolarDeclination(this.getJulianDate(new Date()));
    
    const cosH = (Math.sin(this.toRadians(-angle)) - Math.sin(phi) * Math.sin(delta)) /
                 (Math.cos(phi) * Math.cos(delta));
    
    if (cosH > 1 || cosH < -1) {
      return sunrise;
    }
    
    const h = this.toDegrees(Math.acos(cosH));
    const solarNoon = this.getSolarNoon(this.getJulianDate(new Date()));
    
    return solarNoon - h / 360;
  }

  /**
   * Calculate Isha time
   */
  private getIshaTime(sunset: number, angle: number): number {
    const phi = this.toRadians(this.latitude);
    const delta = this.getSolarDeclination(this.getJulianDate(new Date()));
    
    const cosH = (Math.sin(this.toRadians(-angle)) - Math.sin(phi) * Math.sin(delta)) /
                 (Math.cos(phi) * Math.cos(delta));
    
    if (cosH > 1 || cosH < -1) {
      return sunset;
    }
    
    const h = this.toDegrees(Math.acos(cosH));
    const solarNoon = this.getSolarNoon(this.getJulianDate(new Date()));
    
    return solarNoon + h / 360;
  }

  /**
   * Calculate Dhuhr time (solar noon)
   */
  private getDhuhrTime(solarNoon: number): number {
    return solarNoon;
  }

  /**
   * Calculate Asr time
   */
  private getAsrTime(solarNoon: number): number {
    const phi = this.toRadians(this.latitude);
    const delta = this.getSolarDeclination(this.getJulianDate(new Date()));
    
    // Asr shadow factor (1 for Shafi'i, 2 for Hanafi)
    const shadowFactor = 1;
    const angle = this.toDegrees(Math.atan(1 / (shadowFactor + Math.tan(Math.abs(phi - delta)))));
    
    const cosH = (Math.sin(this.toRadians(angle)) - Math.sin(phi) * Math.sin(delta)) /
                 (Math.cos(phi) * Math.cos(delta));
    
    if (cosH > 1 || cosH < -1) {
      return solarNoon;
    }
    
    const h = this.toDegrees(Math.acos(cosH));
    
    return solarNoon + h / 360;
  }

  /**
   * Calculate Maghrib time (sunset)
   */
  private getMaghribTime(sunset: number): number {
    return sunset;
  }

  /**
   * Convert Julian date to local time
   */
  private julianToLocalTime(julianDate: number): Date {
    const unixTime = (julianDate - 2440587.5) * 86400;
    const utcDate = new Date(unixTime * 1000);
    
    // Adjust for timezone
    const localTime = new Date(utcDate.getTime() + this.timezone * 60 * 60 * 1000);
    
    return localTime;
  }

  /**
   * Format time to HH:MM format
   */
  private formatTime(julianDate: number): string {
    const date = this.julianToLocalTime(julianDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

/**
 * Get timezone offset for a location
 */
export function getTimezoneOffset(location: Location): number {
  // This is a simplified implementation
  // In a real app, you'd use a timezone API or library
  const date = new Date();
  return date.getTimezoneOffset() / -60; // Convert to hours
}

/**
 * Calculate next prayer time
 */
export function getNextPrayer(prayerTimes: PrayerTimes): { prayer: string; time: string; minutesUntil: number } {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayerTimesArray = [
    { name: 'fajr', time: prayerTimes.fajr },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'isha', time: prayerTimes.isha },
  ];

  for (const prayer of prayerTimesArray) {
    const timeParts = prayer.time.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const prayerMinutes = hours * 60 + minutes;
    
    if (prayerMinutes > currentTime) {
      return {
        prayer: prayer.name,
        time: prayer.time,
        minutesUntil: prayerMinutes - currentTime,
      };
    }
  }

  // If no prayer found, return tomorrow's Fajr
  const fajrTimeParts = prayerTimes.fajr.split(':').map(Number);
  const fajrHours = fajrTimeParts[0] ?? 0;
  const fajrMinutes = fajrTimeParts[1] ?? 0;
  const fajrMinutesTotal = fajrHours * 60 + fajrMinutes;
  const minutesUntilFajr = fajrMinutesTotal + (24 * 60 - currentTime);

  return {
    prayer: 'fajr',
    time: prayerTimes.fajr,
    minutesUntil: minutesUntilFajr,
  };
} 