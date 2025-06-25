import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';
import { QiblaCompass } from '../components/QiblaCompass';
import { PrayerTimeWidget } from '../components/PrayerTimeWidget';
import { LocationService } from '../services/locationService';
import { StorageService } from '../services/storageService';
import { PrayerCalculator } from '../utils/prayerCalculations';
import { Location, PrayerTimes, PrayerDay } from '../types';

export const HomeScreen: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerDay, setPrayerDay] = useState<PrayerDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompassCalibrated, setIsCompassCalibrated] = useState(false);

  const locationService = LocationService.getInstance();
  const storageService = StorageService.getInstance();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Get saved location or request new one
      let currentLocation = await storageService.getLocation();
      if (!currentLocation) {
        currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          await storageService.saveLocation(currentLocation);
        }
      }

      if (currentLocation) {
        setLocation(currentLocation);
        await calculatePrayerTimes(currentLocation);
        await loadTodayPrayerRecord();
      } else {
        Alert.alert(
          'Location Required',
          'Please enable location services to get accurate prayer times and qibla direction.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrayerTimes = async (currentLocation: Location) => {
    try {
      const calculator = new PrayerCalculator(currentLocation, 0);
      const times = calculator.calculatePrayerTimes();
      setPrayerTimes(times);
    } catch (error) {
      console.error('Error calculating prayer times:', error);
    }
  };

  const loadTodayPrayerRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0] || '';
      const record = await storageService.getPrayerRecord(today);
      setPrayerDay(record);
    } catch (error) {
      console.error('Error loading prayer record:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await initializeApp();
    setIsRefreshing(false);
  };

  const handlePrayerToggle = async (prayerName: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let currentRecord = prayerDay;

      if (!currentRecord) {
        // Create new prayer record for today
        currentRecord = {
          date: today || '',
          prayers: {
            fajr: { name: 'Fajr', time: prayerTimes?.fajr ?? '', completed: false },
            dhuhr: { name: 'Dhuhr', time: prayerTimes?.dhuhr ?? '', completed: false },
            asr: { name: 'Asr', time: prayerTimes?.asr ?? '', completed: false },
            maghrib: { name: 'Maghrib', time: prayerTimes?.maghrib ?? '', completed: false },
            isha: { name: 'Isha', time: prayerTimes?.isha ?? '', completed: false },
          },
        };
      }

      // Toggle prayer status
      const prayer = currentRecord?.prayers[prayerName as keyof typeof currentRecord.prayers];
      if (prayer) {
        prayer.completed = !prayer.completed;
      }
      prayer.loggedAt = prayer.completed ? new Date().toISOString() : undefined;

      // Save updated record
      await storageService.savePrayerRecord(today || '', currentRecord);
      setPrayerDay(currentRecord);

      // Show confirmation
      const status = prayer.completed ? 'completed' : 'marked as pending';
      Alert.alert('Prayer Updated', `${prayerName} prayer ${status}.`);
    } catch (error) {
      console.error('Error toggling prayer:', error);
      Alert.alert('Error', 'Failed to update prayer status.');
    }
  };

  const handlePrayerPress = (prayerName: string) => {
    const prayer = prayerDay?.prayers[prayerName as keyof typeof prayerDay.prayers];
    if (prayer) {
      Alert.alert(
        `${prayerName} Prayer`,
        `Time: ${prayer.time}\nStatus: ${prayer.completed ? 'Completed' : 'Pending'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: prayer.completed ? 'Mark Pending' : 'Mark Complete', onPress: () => handlePrayerToggle(prayerName) },
        ]
      );
    }
  };

  const handleCalibrationStatusChange = (isCalibrated: boolean) => {
    setIsCompassCalibrated(isCalibrated);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Text style={styles.errorText}>Location access required</Text>
        <Text style={styles.errorSubtext}>
          Please enable location services to use the app
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Qibla Finder</Text>
          <Text style={styles.headerSubtitle}>
            {isCompassCalibrated ? '✓ Compass Calibrated' : 'Calibrating Compass...'}
          </Text>
        </View>

        {/* Qibla Compass */}
        {location && (
          <QiblaCompass
            location={location}
            onCalibrationStatusChange={handleCalibrationStatusChange}
          />
        )}

        {/* Prayer Times */}
        {prayerTimes && (
          <PrayerTimeWidget
            prayerTimes={prayerTimes}
            prayerDay={prayerDay}
            onPrayerToggle={handlePrayerToggle}
            onPrayerPress={handlePrayerPress}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Prayer Log</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Statistics</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>Qada</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
}); 