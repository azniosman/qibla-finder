import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
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
  
  // Reanimated shared values
  const pulseScale = useSharedValue(1);
  const shimmerOpacity = useSharedValue(0.3);
  const cardScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

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
    if (timeUntilNext <= 30) {
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }

    // Shimmer effect
    shimmerOpacity.value = withRepeat(
      withTiming(0.8, { duration: 2000 }),
      -1,
      true
    );

    // Progress animation
    const completionPercentage = getCompletionPercentage();
    progressWidth.value = withTiming(completionPercentage / 100, { duration: 1000 });
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
    cardScale.value = withSpring(0.95, {}, () => {
      cardScale.value = withSpring(1);
    });
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    onPrayerPress(prayerName);
  };

  const handlePrayerToggle = (prayerName: string) => {
    cardScale.value = withSpring(0.9, {}, () => {
      cardScale.value = withSpring(1.02, {}, () => {
        cardScale.value = withSpring(1);
      });
    });
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    onPrayerToggle(prayerName);
  };

  const getCompletedCount = (): number => {
    if (!prayerDay) return 0;
    return Object.values(prayerDay.prayers).filter(prayer => prayer.completed).length;
  };

  const getTotalPrayersCount = (): number => {
    return Object.keys(prayerTimes).filter(prayer => prayer !== 'sunrise').length;
  };

  const getCompletionPercentage = (): number => {
    const completed = getCompletedCount();
    const total = getTotalPrayersCount();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // Animated styles
  const nextPrayerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: shimmerOpacity.value,
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Next Prayer Countdown with Enhanced Design */}
      <Animated.View style={[styles.nextPrayerContainer, nextPrayerAnimatedStyle]}>
        <LinearGradient
          colors={[
            COLORS.primary,
            COLORS.accent,
            timeUntilNext <= 15 ? '#FF6B6B' : COLORS.secondary,
          ]}
          style={styles.nextPrayerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Islamic Pattern SVG */}
          <View style={styles.decorativePattern}>
            <Svg width={80} height={80} viewBox="0 0 100 100" style={styles.patternSvg}>
              <Defs>
                <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="45" fill="url(#grad)" />
              <Path
                d="M30 30 Q50 10 70 30 Q50 50 70 70 Q50 90 30 70 Q50 50 30 30"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.3"
              />
            </Svg>
          </View>
          
          <Animated.View style={shimmerAnimatedStyle}>
            <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
          </Animated.View>
          
          <Text style={styles.nextPrayerName}>
            {PRAYER_NAMES[nextPrayer.prayer as keyof typeof PRAYER_NAMES]}
          </Text>
          
          <View style={styles.timeContainer}>
            <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                {formatTimeUntil(timeUntilNext)}
              </Text>
              {timeUntilNext <= 15 && (
                <Text style={styles.urgentText}>🔔 Soon</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced Prayer Times List */}
      <Animated.View style={[styles.prayerTimesContainer, cardAnimatedStyle]}>
        {Object.entries(prayerTimes).map(([prayerName, prayerTime], index) => {
          if (prayerName === 'sunrise') return null; // Skip sunrise
          
          const status = getPrayerStatus(prayerName);
          const isNextPrayer = prayerName === nextPrayer.prayer;
          
          return (
            <TouchableOpacity
              key={prayerName}
              style={[
                styles.prayerRow,
                isNextPrayer && styles.nextPrayerRow,
                { borderLeftColor: getStatusColor(status), borderLeftWidth: 4 },
              ]}
              onPress={() => handlePrayerPress(prayerName)}
              onLongPress={() => handlePrayerToggle(prayerName)}
            >
              <View style={styles.prayerInfo}>
                <View style={styles.prayerHeader}>
                  <View style={styles.prayerNameContainer}>
                    <Text style={styles.prayerName}>
                      {PRAYER_NAMES[prayerName as keyof typeof PRAYER_NAMES]}
                    </Text>
                    {isNextPrayer && (
                      <View style={styles.nextBadge}>
                        <Text style={styles.nextBadgeText}>NEXT</Text>
                      </View>
                    )}
                  </View>
                  
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
                
                <View style={styles.timeRow}>
                  <Text style={styles.prayerTime}>{prayerTime}</Text>
                  {status === 'completed' && (
                    <Text style={styles.completedAt}>
                      ✓ {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.prayerActions}>
                {status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handlePrayerToggle(prayerName)}
                  >
                    <Text style={styles.completeButtonText}>✓ Complete</Text>
                  </TouchableOpacity>
                )}
                {status === 'missed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.qadaButton]}
                    onPress={() => handlePrayerToggle(prayerName)}
                  >
                    <Text style={styles.qadaButtonText}>🔄 Qada</Text>
                  </TouchableOpacity>
                )}
                {status === 'completed' && (
                  <View style={[styles.actionButton, styles.completedIndicator]}>
                    <Text style={styles.completedText}>🎉 Done</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Enhanced Today's Summary */}
      {prayerDay && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Progress</Text>
            <Text style={styles.summaryPercentage}>
              {Math.round(getCompletionPercentage())}%
            </Text>
          </View>
          
          {/* Enhanced Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  progressAnimatedStyle,
                  {
                    backgroundColor: getCompletionPercentage() === 100 ? COLORS.success : COLORS.primary,
                  },
                ]}
              />
              <View style={styles.progressShimmer} />
            </View>
            
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>
                {getCompletedCount()} of {getTotalPrayersCount()} prayers completed
              </Text>
              {getCompletionPercentage() === 100 && (
                <Text style={styles.completionCelebration}>🎉 All prayers completed!</Text>
              )}
            </View>
          </View>

          {/* Enhanced Prayer Status Visualization */}
          <View style={styles.summaryStats}>
            {Object.entries(prayerDay.prayers).map(([prayerName, prayer], index) => {
              const status = getPrayerStatus(prayerName);
              return (
                <View key={prayerName} style={styles.summaryItem}>
                  <View style={styles.summaryDotContainer}>
                    <View
                      style={[
                        styles.summaryDot,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    />
                    {status === 'completed' && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.summaryLabel}>
                    {PRAYER_NAMES[prayerName as keyof typeof PRAYER_NAMES]}
                  </Text>
                </View>
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
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    position: 'relative',
  },
  nextPrayerGradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativePattern: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 0.1,
  },
  patternSvg: {
    opacity: 0.3,
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  urgentText: {
    color: '#FFE66D',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    backgroundColor: COLORS.surface,
  },
  nextPrayerRow: {
    backgroundColor: `${COLORS.primary}10`,
    borderLeftColor: COLORS.primary,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prayerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nextBadgeText: {
    color: COLORS.surface,
    fontSize: 8,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedAt: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '500',
  },
  prayerName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  completeButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  qadaButton: {
    backgroundColor: COLORS.warning,
  },
  qadaButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  completedIndicator: {
    backgroundColor: `${COLORS.success}20`,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
  },
  completedText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressStats: {
    alignItems: 'center',
  },
  completionCelebration: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    alignItems: 'center',
    marginBottom: 12,
    flex: 1,
    minWidth: '18%',
  },
  summaryDotContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  summaryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  checkmark: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.surface,
    fontSize: 6,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 