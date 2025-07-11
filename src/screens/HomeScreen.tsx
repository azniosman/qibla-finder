import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../utils/constants';
import { QiblaCompass } from '../components/QiblaCompass';
import { PrayerTimeWidget } from '../components/PrayerTimeWidget';
import { LocationService } from '../services/locationService';
import { StorageService } from '../services/storageService';
import { PrayerCalculator } from '../utils/prayerCalculations';
import { Location, PrayerTimes, PrayerDay } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState<Location | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerDay, setPrayerDay] = useState<PrayerDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCompassCalibrated, setIsCompassCalibrated] = useState(false);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const quickActionsScale = useSharedValue(0.8);
  
  // Animated styles - defined at component level to avoid conditional hooks
  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: quickActionsScale.value }] }));

  const locationService = LocationService.getInstance();
  const storageService = StorageService.getInstance();

  const initializeApp = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    initializeApp();
    
    // Animate in components
    headerOpacity.value = withDelay(300, withSpring(1));
    quickActionsScale.value = withDelay(600, withSpring(1));
  }, [initializeApp]);

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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'prayer-log':
        navigation.navigate('Prayer Times' as never);
        break;
      case 'statistics':
        // TODO: Navigate to statistics screen when implemented
        Alert.alert('Statistics', 'Prayer statistics feature coming soon!');
        break;
      case 'qada':
        navigation.navigate('Qada' as never);
        break;
      case 'settings':
        navigation.navigate('Settings' as never);
        break;
      default:
        break;
    }
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
        {/* Enhanced Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]} entering={FadeIn.delay(200)}>
          <LinearGradient
            colors={[COLORS.background, `${COLORS.primary}10`]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Qibla Finder</Text>
              <Text style={styles.headerSubtitle}>
                {isCompassCalibrated ? '✅ Compass Ready' : '🔄 Calibrating Compass...'}
              </Text>
              
              {/* Islamic greeting based on time */}
              <Text style={styles.greetingText}>
                {new Date().getHours() < 12 ? '🌅 Good Morning' : 
                 new Date().getHours() < 18 ? '☀️ Good Afternoon' : '🌙 Good Evening'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Qibla Compass with Animation */}
        {location && (
          <Animated.View entering={SlideInDown.delay(400)}>
            <QiblaCompass
              location={location}
              onCalibrationStatusChange={handleCalibrationStatusChange}
            />
          </Animated.View>
        )}

        {/* Prayer Times with Animation */}
        {prayerTimes && (
          <Animated.View entering={SlideInDown.delay(600)}>
            <PrayerTimeWidget
              prayerTimes={prayerTimes}
              prayerDay={prayerDay}
              onPrayerToggle={handlePrayerToggle}
              onPrayerPress={handlePrayerPress}
            />
          </Animated.View>
        )}

        {/* Enhanced Quick Actions */}
        <Animated.View 
          style={[styles.quickActions, quickActionsAnimatedStyle]} 
          entering={SlideInDown.delay(800)}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <QuickActionButton
              icon="📅"
              title="Prayer Log"
              subtitle="View history"
              onPress={() => handleQuickAction('prayer-log')}
              color={COLORS.primary}
            />
            <QuickActionButton
              icon="📊"
              title="Statistics"
              subtitle="Track progress"
              onPress={() => handleQuickAction('statistics')}
              color={COLORS.accent}
            />
            <QuickActionButton
              icon="🔄"
              title="Qada"
              subtitle="Missed prayers"
              onPress={() => handleQuickAction('qada')}
              color={COLORS.warning}
            />
            <QuickActionButton
              icon="⚙️"
              title="Settings"
              subtitle="Preferences"
              onPress={() => handleQuickAction('settings')}
              color={COLORS.secondary}
            />
          </View>
        </Animated.View>
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
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActions: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  actionButtonGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  actionButtonPattern: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.1,
  },
  patternOverlay: {
    opacity: 0.3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.surface,
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
});

// Enhanced Quick Action Button Component
interface QuickActionButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  color,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1.05, {}, () => {
        scale.value = withSpring(1);
      });
    });
    rotation.value = withSpring(5, {}, () => {
      rotation.value = withSpring(0);
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.actionButtonContainer}>
      <Animated.View style={[styles.actionButton, animatedStyle]}>
        <LinearGradient
          colors={[color, `${color}80`]}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background Pattern */}
          <View style={styles.actionButtonPattern}>
            <Svg width={40} height={40} viewBox="0 0 100 100" style={styles.patternOverlay}>
              <Defs>
                <SvgLinearGradient id="actionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="50" cy="50" r="30" fill="url(#actionGrad)" />
              <Path
                d="M20 20 Q50 10 80 20 Q50 40 80 60 Q50 70 20 60 Q50 40 20 20"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </Svg>
          </View>
          
          <Text style={styles.actionIcon}>{icon}</Text>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};