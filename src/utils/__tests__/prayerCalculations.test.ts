import { PrayerCalculator, getNextPrayer } from '../prayerCalculations';
import { Location, PrayerTimes } from '../../types';

describe('PrayerCalculator', () => {
  const testLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const testPrayerTimes: PrayerTimes = {
    fajr: '05:30',
    sunrise: '06:45',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:45',
    isha: '20:15',
  };

  describe('calculatePrayerTimes', () => {
    it('should calculate prayer times for a given location', () => {
      const calculator = new PrayerCalculator(testLocation, -5);
      const times = calculator.calculatePrayerTimes();

      expect(times).toHaveProperty('fajr');
      expect(times).toHaveProperty('dhuhr');
      expect(times).toHaveProperty('asr');
      expect(times).toHaveProperty('maghrib');
      expect(times).toHaveProperty('isha');
      expect(times).toHaveProperty('sunrise');

      // Check that times are in HH:MM format
      const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      expect(times.fajr).toMatch(timeFormat);
      expect(times.dhuhr).toMatch(timeFormat);
      expect(times.asr).toMatch(timeFormat);
      expect(times.maghrib).toMatch(timeFormat);
      expect(times.isha).toMatch(timeFormat);
      expect(times.sunrise).toMatch(timeFormat);
    });

    it('should handle different calculation methods', () => {
      const calculator = new PrayerCalculator(testLocation, -5, 'MWL');
      const times = calculator.calculatePrayerTimes();

      expect(times).toBeDefined();
      expect(typeof times.fajr).toBe('string');
      expect(typeof times.isha).toBe('string');
    });
  });

  describe('calculateQiblaDirection', () => {
    it('should calculate qibla direction from current location', () => {
      const calculator = new PrayerCalculator(testLocation, -5);
      const qiblaDirection = calculator.calculateQiblaDirection();

      expect(qiblaDirection).toHaveProperty('bearing');
      expect(qiblaDirection).toHaveProperty('distance');

      expect(typeof qiblaDirection.bearing).toBe('number');
      expect(typeof qiblaDirection.distance).toBe('number');

      // Bearing should be between 0 and 360 degrees
      expect(qiblaDirection.bearing).toBeGreaterThanOrEqual(0);
      expect(qiblaDirection.bearing).toBeLessThanOrEqual(360);

      // Distance should be positive
      expect(qiblaDirection.distance).toBeGreaterThan(0);
    });

    it('should calculate correct qibla direction for New York', () => {
      const calculator = new PrayerCalculator(testLocation, -5);
      const qiblaDirection = calculator.calculateQiblaDirection();

      // Qibla direction from New York should be approximately 58 degrees
      // (toward Mecca from New York)
      expect(qiblaDirection.bearing).toBeCloseTo(58, -1);
    });
  });
});

describe('getNextPrayer', () => {
  const testPrayerTimes: PrayerTimes = {
    fajr: '05:30',
    sunrise: '06:45',
    dhuhr: '12:15',
    asr: '15:30',
    maghrib: '18:45',
    isha: '20:15',
  };

  it('should return the next prayer time', () => {
    const nextPrayer = getNextPrayer(testPrayerTimes);

    expect(nextPrayer).toHaveProperty('prayer');
    expect(nextPrayer).toHaveProperty('time');
    expect(nextPrayer).toHaveProperty('minutesUntil');

    expect(typeof nextPrayer.prayer).toBe('string');
    expect(typeof nextPrayer.time).toBe('string');
    expect(typeof nextPrayer.minutesUntil).toBe('number');

    expect(nextPrayer.minutesUntil).toBeGreaterThanOrEqual(0);
  });

  it('should return a valid prayer name', () => {
    const nextPrayer = getNextPrayer(testPrayerTimes);
    const validPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    expect(validPrayers).toContain(nextPrayer.prayer);
  });

  it('should return a valid time format', () => {
    const nextPrayer = getNextPrayer(testPrayerTimes);
    const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    expect(nextPrayer.time).toMatch(timeFormat);
  });
}); 