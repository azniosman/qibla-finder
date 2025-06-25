import { Magnetometer } from 'expo-sensors';
import { Location as LocationType } from '../types';
import { PrayerCalculator } from '../utils/prayerCalculations';
import { COMPASS_SETTINGS } from '../utils/constants';

/**
 * Compass service for handling magnetometer data and qibla direction
 */
export class CompassService {
  private static instance: CompassService;
  private magnetometerSubscription: any | null = null;
  private currentHeading: number = 0;
  private qiblaBearing: number = 0;
  private isCalibrated: boolean = false;
  private calibrationReadings: number[] = [];
  private onHeadingChange: ((heading: number, qiblaDirection: number) => void) | null = null;

  private constructor() {}

  static getInstance(): CompassService {
    if (!CompassService.instance) {
      CompassService.instance = new CompassService();
    }
    return CompassService.instance;
  }

  /**
   * Initialize compass with location
   */
  initialize(location: LocationType): void {
    const calculator = new PrayerCalculator(location, 0);
    const qiblaDirection = calculator.calculateQiblaDirection();
    this.qiblaBearing = qiblaDirection.bearing;
  }

  /**
   * Start compass updates
   */
  startCompassUpdates(
    onHeadingChange: (heading: number, qiblaDirection: number) => void
  ): void {
    this.onHeadingChange = onHeadingChange;

    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove();
    }

    this.magnetometerSubscription = Magnetometer.addListener((data) => {
      this.updateHeading(data);
    });

    // Set update interval
    Magnetometer.setUpdateInterval(COMPASS_SETTINGS.updateInterval);
  }

  /**
   * Stop compass updates
   */
  stopCompassUpdates(): void {
    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove();
      this.magnetometerSubscription = null;
    }
    this.onHeadingChange = null;
  }

  /**
   * Update heading based on magnetometer data
   */
  private updateHeading(data: { x: number; y: number; z: number }): void {
    // Calculate heading from magnetometer data
    const heading = this.calculateHeading(data.x, data.y);
    
    if (heading !== null) {
      this.currentHeading = heading;
      
      // Calculate qibla direction relative to current heading
      const qiblaDirection = this.calculateQiblaDirection(heading);
      
      // Check calibration
      this.checkCalibration(heading);
      
      // Notify listeners
      if (this.onHeadingChange) {
        this.onHeadingChange(heading, qiblaDirection);
      }
    }
  }

  /**
   * Calculate heading from magnetometer data
   */
  private calculateHeading(x: number, y: number): number | null {
    // Check if magnetometer data is valid
    if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
      return null; // Invalid data
    }

    // Calculate heading in radians
    let heading = Math.atan2(y, x);
    
    // Convert to degrees
    heading = heading * (180 / Math.PI);
    
    // Normalize to 0-360 degrees
    heading = (heading + 360) % 360;
    
    return heading;
  }

  /**
   * Calculate qibla direction relative to current heading
   */
  private calculateQiblaDirection(heading: number): number {
    let qiblaDirection = this.qiblaBearing - heading;
    
    // Normalize to -180 to 180 degrees
    if (qiblaDirection > 180) {
      qiblaDirection -= 360;
    } else if (qiblaDirection < -180) {
      qiblaDirection += 360;
    }
    
    return qiblaDirection;
  }

  /**
   * Check compass calibration
   */
  private checkCalibration(heading: number): void {
    this.calibrationReadings.push(heading);
    
    // Keep only last 10 readings
    if (this.calibrationReadings.length > 10) {
      this.calibrationReadings.shift();
    }
    
    // Check if compass is calibrated (consistent readings)
    if (this.calibrationReadings.length >= 5) {
      const variance = this.calculateVariance(this.calibrationReadings);
      this.isCalibrated = variance < COMPASS_SETTINGS.calibrationThreshold;
    }
  }

  /**
   * Calculate variance of readings
   */
  private calculateVariance(readings: number[]): number {
    const mean = readings.reduce((sum, reading) => sum + reading, 0) / readings.length;
    const squaredDiffs = readings.map(reading => Math.pow(reading - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / readings.length;
    return Math.sqrt(variance);
  }

  /**
   * Get current heading
   */
  getCurrentHeading(): number {
    return this.currentHeading;
  }

  /**
   * Get qibla bearing
   */
  getQiblaBearing(): number {
    return this.qiblaBearing;
  }

  /**
   * Check if compass is calibrated
   */
  isCompassCalibrated(): boolean {
    return this.isCalibrated;
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus(): { isCalibrated: boolean; progress: number } {
    const progress = Math.min(this.calibrationReadings.length / 10, 1);
    return {
      isCalibrated: this.isCalibrated,
      progress,
    };
  }

  /**
   * Reset calibration
   */
  resetCalibration(): void {
    this.calibrationReadings = [];
    this.isCalibrated = false;
  }

  /**
   * Check if device is pointing towards qibla
   */
  isPointingTowardsQibla(heading: number): boolean {
    const qiblaDirection = this.calculateQiblaDirection(heading);
    return Math.abs(qiblaDirection) <= COMPASS_SETTINGS.vibrationThreshold;
  }

  /**
   * Get qibla accuracy (how close to qibla direction)
   */
  getQiblaAccuracy(heading: number): number {
    const qiblaDirection = this.calculateQiblaDirection(heading);
    return Math.abs(qiblaDirection);
  }

  /**
   * Get cardinal direction from heading
   */
  getCardinalDirection(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index] ?? 'N';
  }

  /**
   * Format heading for display
   */
  formatHeading(heading: number): string {
    return `${Math.round(heading)}° ${this.getCardinalDirection(heading)}`;
  }
} 