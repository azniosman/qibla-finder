import * as Location from 'expo-location';
import { Location as LocationType } from '../types';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Location service for handling GPS and location permissions
 */
export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationType | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw ErrorHandler.createPermissionError('Location');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start location updates
   */
  async startLocationUpdates(
    onLocationUpdate: (location: LocationType) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      // Stop any existing subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update if moved 10 meters
        },
        (location) => {
          const newLocation: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            timestamp: location.timestamp,
          };

          this.currentLocation = newLocation;
          onLocationUpdate(newLocation);
        }
      );
    } catch (error) {
      console.error('Error starting location updates:', error);
      throw error;
    }
  }

  /**
   * Stop location updates
   */
  stopLocationUpdates(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Get cached location
   */
  getCachedLocation(): LocationType | null {
    return this.currentLocation;
  }

  /**
   * Get location from address (reverse geocoding)
   */
  async getLocationFromAddress(address: string): Promise<LocationType | null> {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const result = results[0];
        if (result) {
          return {
            latitude: result.latitude,
            longitude: result.longitude,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting location from address:', error);
      return null;
    }
  }

  /**
   * Get address from location (geocoding)
   */
  async getAddressFromLocation(location: LocationType): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        if (result) {
          const addressParts = [
            result.street,
            result.city,
            result.region,
            result.country,
          ].filter(Boolean);

          return addressParts.join(', ');
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting address from location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two locations
   */
  calculateDistance(
    location1: LocationType,
    location2: LocationType
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(location1.latitude)) *
        Math.cos(this.toRadians(location2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking if location services are enabled:', error);
      return false;
    }
  }
} 