import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QiblaCompass } from '../components/QiblaCompass';
import { LocationService } from '../services/locationService';
import { StorageService } from '../services/storageService';
import { Location } from '../types';
import { COLORS } from '../utils/constants';

export const QiblaScreen: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locationService = LocationService.getInstance();
  const storageService = StorageService.getInstance();

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      // Try to get cached location first
      let currentLocation = await storageService.getLocation();
      
      if (!currentLocation) {
        // Request fresh location
        currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          await storageService.saveLocation(currentLocation);
        }
      }

      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setLocationError('Unable to get location. Please enable location services.');
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setLocationError('Failed to load location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLocation();
    setIsRefreshing(false);
  };

  const handleLocationUpdate = async () => {
    try {
      const newLocation = await locationService.getCurrentLocation();
      if (newLocation) {
        setLocation(newLocation);
        await storageService.saveLocation(newLocation);
        setLocationError(null);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationError || !location) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.errorText}>
            {locationError || 'Location not available'}
          </Text>
          <Text style={styles.errorSubtext}>
            Pull down to refresh or enable location services in your device settings.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Qibla Direction</Text>
          <Text style={styles.subtitle}>
            Point your device towards the Kaaba in Mecca
          </Text>
        </View>

        <QiblaCompass 
          location={location}
          onCalibrationStatusChange={(isCalibrated) => {
            if (!isCalibrated) {
              // Could show calibration tips
            }
          }}
        />

        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Current Location</Text>
          <Text style={styles.locationText}>
            Latitude: {location.latitude.toFixed(6)}°
          </Text>
          <Text style={styles.locationText}>
            Longitude: {location.longitude.toFixed(6)}°
          </Text>
          {location.accuracy && (
            <Text style={styles.accuracyText}>
              Accuracy: ±{Math.round(location.accuracy)}m
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  locationInfo: {
    marginTop: 30,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  accuracyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 5,
  },
});