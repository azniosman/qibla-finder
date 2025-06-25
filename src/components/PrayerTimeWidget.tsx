import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, PRAYER_NAMES } from '../utils/constants';
import { PrayerTimes, PrayerDay } from '../types';
import { getNextPrayer } from '../utils/prayerCalculations';

interface PrayerTimeWidgetProps {
  prayerTimes: PrayerTimes;
  prayerDay: PrayerDay | null;
  onPrayerToggle: (prayerName: string) => void;
  onPrayerPress: (prayerName: string) => void;
}

export const PrayerTimeWidget: React.FC<PrayerTimeWidgetProps> = ({
  prayerTimes,
  prayerDay,
  onPrayerToggle,
  onPrayerPress,
}) => {
  const [nextPrayer, setNextPrayer] = useState(getNextPrayer(prayerTimes));
  const [timeUntilNext, setTimeUntilNext] = useState(nextPrayer.minutesUntil);
  const pulseAnimation = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const timer = setInterval(() => {
      const updatedNextPrayer = getNextPrayer(prayerTimes);
      setNextPrayer(updatedNextPrayer);
      setTimeUntilNext(updatedNextPrayer.minutesUntil);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [prayerTimes]);

  useEffect(() => {
    // Pulse animation for next prayer
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (timeUntilNext <= 30) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnimation.setValue(1);
    }

    return () => pulse.stop();
  }, [timeUntilNext]);

  const formatTimeUntil = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPrayerStatus = (prayerName: string) => {
    if (!prayerDay) return 'pending';
    const prayer = prayerDay.prayers[prayerName as keyof typeof prayerDay.prayers];
    if (prayer.completed) return 'completed';
    
    const timeParts = prayer.time.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const prayerTime = hours * 60 + minutes;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (prayerTime < currentTime) return 'missed';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.completed;
      case 'missed':
        return COLORS.missed;
      case 'pending':
        return COLORS.pending;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'missed':
        return '❌';
      case 'pending':
        return '⏰';
      default:
        return '•';
    }
  };

  const handlePrayerPress = (prayerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrayerPress(prayerName);
  };

  const handlePrayerToggle = (prayerName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPrayerToggle(prayerName);
  };

  return (
    <View style={styles.container}>
      {/* Next Prayer Countdown */}
      <Animated.View
        style={[
          styles.nextPrayerContainer,
          {
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          style={styles.nextPrayerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
          <Text style={styles.nextPrayerName}>
            {PRAYER_NAMES[nextPrayer.prayer as keyof typeof PRAYER_NAMES]}
          </Text>
          <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
          <Text style={styles.countdownText}>
            {formatTimeUntil(timeUntilNext)}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Prayer Times List */}
      <View style={styles.prayerTimesContainer}>
        {Object.entries(prayerTimes).map(([prayerName, prayerTime]) => {
          if (prayerName === 'sunrise') return null; // Skip sunrise
          
          const status = getPrayerStatus(prayerName);
          const isNextPrayer = prayerName === nextPrayer.prayer;
          
          return (
            <TouchableOpacity
              key={prayerName}
              style={[
                styles.prayerRow,
                isNextPrayer && styles.nextPrayerRow,
              ]}
              onPress={() => handlePrayerPress(prayerName)}
              onLongPress={() => handlePrayerToggle(prayerName)}
            >
              <View style={styles.prayerInfo}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerName}>
                    {PRAYER_NAMES[prayerName as keyof typeof PRAYER_NAMES]}
                  </Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  >
                    <Text style={styles.statusIcon}>
                      {getStatusIcon(status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.prayerTime}>{prayerTime}</Text>
              </View>
              
              <View style={styles.prayerActions}>
                {status === 'pending' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handlePrayerToggle(prayerName)}
                  >
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
                {status === 'missed' && (
                  <TouchableOpacity
                    style={styles.qadaButton}
                    onPress={() => handlePrayerToggle(prayerName)}
                  >
                    <Text style={styles.qadaButtonText}>Qada</Text>
                  </TouchableOpacity>
                )}
                {status === 'completed' && (
                  <View style={styles.completedIndicator}>
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today's Summary */}
      {prayerDay && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Today's Progress</Text>
          <View style={styles.summaryStats}>
            {Object.entries(prayerDay.prayers).map(([prayerName, prayer]) => {
              const status = getPrayerStatus(prayerName);
              return (
                <View
                  key={prayerName}
                  style={[
                    styles.summaryDot,
                    { backgroundColor: getStatusColor(status) },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  nextPrayerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextPrayerGradient: {
    padding: 20,
    alignItems: 'center',
  },
  nextPrayerLabel: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  nextPrayerName: {
    color: COLORS.surface,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nextPrayerTime: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  countdownText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    opacity: 0.9,
  },
  prayerTimesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  nextPrayerRow: {
    backgroundColor: COLORS.background,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 12,
    color: COLORS.surface,
  },
  prayerTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  prayerActions: {
    alignItems: 'flex-end',
  },
  completeButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  qadaButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qadaButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  completedIndicator: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
}); 