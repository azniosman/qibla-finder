import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/constants';
import { CompassService } from '../services/compassService';
import { Location as LocationType } from '../types';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;
const INNER_CIRCLE_SIZE = COMPASS_SIZE * 0.6;

interface QiblaCompassProps {
  location: LocationType;
  onCalibrationStatusChange?: (isCalibrated: boolean) => void;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  location,
  onCalibrationStatusChange,
}) => {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isPointingTowardsQibla, setIsPointingTowardsQibla] = useState(false);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const kaabaRotation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const compassService = CompassService.getInstance();

  useEffect(() => {
    // Initialize compass with location
    compassService.initialize(location);

    // Start compass updates
    compassService.startCompassUpdates((newHeading, newQiblaDirection) => {
      setHeading(newHeading);
      setQiblaDirection(newQiblaDirection);

      // Animate compass rotation
      Animated.timing(compassRotation, {
        toValue: -newHeading,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Animate Kaaba rotation
      Animated.timing(kaabaRotation, {
        toValue: newQiblaDirection,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Check if pointing towards qibla
      const pointingTowardsQibla = compassService.isPointingTowardsQibla(newHeading);
      setIsPointingTowardsQibla(pointingTowardsQibla);

      // Vibrate when pointing towards qibla
      if (pointingTowardsQibla) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Update calibration status
      const calibrationStatus = compassService.getCalibrationStatus();
      setIsCalibrated(calibrationStatus.isCalibrated);
      setCalibrationProgress(calibrationStatus.progress);

      if (onCalibrationStatusChange) {
        onCalibrationStatusChange(calibrationStatus.isCalibrated);
      }
    });

    // Start pulse animation when pointing towards qibla
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
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

    if (isPointingTowardsQibla) {
      pulseAnimationLoop.start();
    } else {
      pulseAnimationLoop.stop();
      pulseAnimation.setValue(1);
    }

    return () => {
      compassService.stopCompassUpdates();
    };
  }, [location, isPointingTowardsQibla, compassRotation, kaabaRotation, pulseAnimation, compassService, onCalibrationStatusChange]);

  const handleCalibrationHelp = () => {
    Alert.alert(
      'Compass Calibration',
      'To calibrate your compass:\n\n1. Hold your phone flat\n2. Move it in a figure-8 pattern\n3. Rotate it 360° in all directions\n4. Keep away from metal objects\n\nThis helps ensure accurate qibla direction.',
      [{ text: 'OK' }]
    );
  };

  const getAccuracyColor = () => {
    const accuracy = Math.abs(qiblaDirection);
    if (accuracy <= 5) return COLORS.success;
    if (accuracy <= 15) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.container}>
      {/* Compass Container */}
      <View style={styles.compassContainer}>
        {/* Outer Ring */}
        <View style={styles.outerRing}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.gradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Compass Face */}
        <Animated.View
          style={[
            styles.compassFace,
            {
              transform: [{ rotate: `${compassRotation}deg` }],
            },
          ]}
        >
          {/* Cardinal Directions */}
          <Text style={[styles.cardinalDirection, styles.north]}>N</Text>
          <Text style={[styles.cardinalDirection, styles.east]}>E</Text>
          <Text style={[styles.cardinalDirection, styles.south]}>S</Text>
          <Text style={[styles.cardinalDirection, styles.west]}>W</Text>

          {/* Degree Markings */}
          {Array.from({ length: 24 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.degreeMark,
                {
                  transform: [{ rotate: `${i * 15}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.degreeLine,
                  { height: i % 6 === 0 ? 20 : 10 },
                ]}
              />
            </View>
          ))}
        </Animated.View>

        {/* Inner Circle with Kaaba */}
        <View style={styles.innerCircle}>
          <LinearGradient
            colors={[COLORS.surface, COLORS.background]}
            style={styles.innerGradient}
          >
            {/* Kaaba Icon */}
            <Animated.View
              style={[
                styles.kaabaContainer,
                {
                  transform: [
                    { rotate: `${kaabaRotation}deg` },
                    { scale: pulseAnimation },
                  ],
                },
              ]}
            >
              <View style={styles.kaabaIcon}>
                <Text style={styles.kaabaText}>🕋</Text>
              </View>
              <Text style={styles.qiblaText}>Qibla</Text>
            </Animated.View>

            {/* Direction Indicator */}
            <View style={styles.directionIndicator}>
              <View
                style={[
                  styles.indicatorArrow,
                  {
                    backgroundColor: getAccuracyColor(),
                    transform: [{ rotate: `${qiblaDirection}deg` }],
                  },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Calibration Indicator */}
        <TouchableOpacity
          style={styles.calibrationIndicator}
          onPress={handleCalibrationHelp}
        >
          <View
            style={[
              styles.calibrationDot,
              {
                backgroundColor: isCalibrated ? COLORS.success : COLORS.warning,
              },
            ]}
          />
          <Text style={styles.calibrationText}>
            {isCalibrated ? 'Calibrated' : 'Calibrating...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Information Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Direction:</Text>
          <Text style={styles.infoValue}>
            {compassService.formatHeading(heading)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Qibla Direction:</Text>
          <Text style={styles.infoValue}>
            {Math.round(compassService.getQiblaBearing())}°
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Accuracy:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: getAccuracyColor() },
            ]}
          >
            {Math.round(Math.abs(qiblaDirection))}°
          </Text>
        </View>
        {isPointingTowardsQibla && (
          <View style={styles.alignmentIndicator}>
            <Text style={styles.alignmentText}>✓ Aligned with Qibla</Text>
          </View>
        )}
      </View>

      {/* Calibration Progress */}
      {!isCalibrated && (
        <View style={styles.calibrationProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${calibrationProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(calibrationProgress * 100)}% Calibrated
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'relative',
  },
  outerRing: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    position: 'absolute',
  },
  gradientRing: {
    width: '100%',
    height: '100%',
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  compassFace: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'absolute',
  },
  cardinalDirection: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  north: {
    top: 10,
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  east: {
    top: '50%',
    right: 10,
    transform: [{ translateY: -12 }],
  },
  south: {
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  west: {
    top: '50%',
    left: 10,
    transform: [{ translateY: -12 }],
  },
  degreeMark: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: COMPASS_SIZE,
  },
  degreeLine: {
    width: 2,
    backgroundColor: COLORS.textSecondary,
    position: 'absolute',
    top: 0,
  },
  innerCircle: {
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    position: 'absolute',
    top: (COMPASS_SIZE - INNER_CIRCLE_SIZE) / 2,
    left: (COMPASS_SIZE - INNER_CIRCLE_SIZE) / 2,
    overflow: 'hidden',
  },
  innerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: INNER_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaContainer: {
    alignItems: 'center',
    position: 'absolute',
  },
  kaabaIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  kaabaText: {
    fontSize: 30,
  },
  qiblaText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  directionIndicator: {
    position: 'absolute',
    width: 4,
    height: INNER_CIRCLE_SIZE * 0.4,
  },
  indicatorArrow: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  calibrationIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  calibrationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  calibrationText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  infoPanel: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  alignmentIndicator: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
  },
  alignmentText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  calibrationProgress: {
    marginTop: 15,
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 