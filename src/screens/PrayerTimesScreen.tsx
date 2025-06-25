import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrayerTimeWidget } from '../components/PrayerTimeWidget';
import { LocationService } from '../services/locationService';
import { StorageService } from '../services/storageService';
import { PrayerCalculator } from '../utils/prayerCalculations';
import { Location, PrayerTimes, PrayerDay } from '../types';
import { COLORS } from '../utils/constants';

export const PrayerTimesScreen: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerDay, setPrayerDay] = useState<PrayerDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationService = LocationService.getInstance();
  const storageService = StorageService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Get location
      let currentLocation = await storageService.getLocation();
      if (!currentLocation) {
        currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          await storageService.saveLocation(currentLocation);
        }
      }

      if (!currentLocation) {
        throw new Error('Location not available');
      }

      setLocation(currentLocation);

      // Calculate prayer times
      const calculator = new PrayerCalculator(currentLocation, 0);
      const times = calculator.calculatePrayerTimes();
      setPrayerTimes(times);

      // Load today's prayer record
      const today = new Date().toISOString().split('T')[0] || '';
      const record = await storageService.getPrayerRecord(today);
      setPrayerDay(record);

    } catch (error) {
      console.error('Error loading prayer data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load prayer times');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handlePrayerToggle = async (prayerName: string) => {
    if (!prayerTimes) return;

    try {
      const today = new Date().toISOString().split('T')[0] || '';
      let currentRecord = prayerDay;

      if (!currentRecord) {
        // Create new prayer record for today
        currentRecord = {
          date: today,
          prayers: {
            fajr: { name: 'Fajr', time: prayerTimes.fajr, completed: false },
            dhuhr: { name: 'Dhuhr', time: prayerTimes.dhuhr, completed: false },
            asr: { name: 'Asr', time: prayerTimes.asr, completed: false },
            maghrib: { name: 'Maghrib', time: prayerTimes.maghrib, completed: false },
            isha: { name: 'Isha', time: prayerTimes.isha, completed: false },
          },
        };
      }

      // Toggle prayer status
      const prayer = currentRecord.prayers[prayerName as keyof typeof currentRecord.prayers];
      if (prayer) {
        prayer.completed = !prayer.completed;
        prayer.loggedAt = prayer.completed ? new Date().toISOString() : undefined;
      }

      // Save updated record
      await storageService.savePrayerRecord(today, currentRecord);
      setPrayerDay(currentRecord);
    } catch (error) {
      console.error('Error updating prayer status:', error);
      Alert.alert('Error', 'Failed to update prayer status. Please try again.');
    }
  };

  const handlePrayerPress = (prayerName: string) => {
    // Could navigate to prayer details or show more info
    Alert.alert(
      'Prayer Information',
      `${prayerName} prayer time and additional information could be shown here.`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prayer times...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !prayerTimes) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.errorText}>
            {error || 'Prayer times not available'}
          </Text>
          <Text style={styles.errorSubtext}>
            Pull down to refresh or check your location settings.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <PrayerTimeWidget
          prayerTimes={prayerTimes}
          prayerDay={prayerDay}
          onPrayerToggle={handlePrayerToggle}
          onPrayerPress={handlePrayerPress}
        />

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Location</Text>
            <Text style={styles.locationText}>
              {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  locationInfo: {
    margin: 20,
    marginTop: 10,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});