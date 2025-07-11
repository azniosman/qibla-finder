import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../utils/constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = COLORS.primary,
  text,
  style,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1
    );

    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    opacity.value = withRepeat(
      withTiming(1, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 60;
      case 'large':
        return 80;
      default:
        return 60;
    }
  };

  const spinnerSize = getSize();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const dotAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      rotation.value,
      [0, 180, 360],
      [0, -10, 0]
    );
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Islamic-themed SVG Loading Spinner */}
      <Animated.View style={[styles.spinnerContainer, animatedStyle]}>
        <Svg width={spinnerSize} height={spinnerSize} viewBox="0 0 100 100">
          {/* Outer Ring with Islamic Pattern */}
          <Circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`${color}20`}
            strokeWidth="2"
          />
          <Circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="10 5"
            strokeLinecap="round"
          />
          
          {/* Inner Crescent */}
          <Path
            d="M35 25 Q50 40 35 55 Q45 40 35 25"
            fill={color}
            opacity="0.7"
          />
          
          {/* Star */}
          <Path
            d="M50 15 L52 22 L60 22 L54 27 L56 34 L50 30 L44 34 L46 27 L40 22 L48 22 Z"
            fill={color}
            opacity="0.8"
          />
          
          {/* Animated dots around the circle */}
          {[0, 60, 120, 180, 240, 300].map((angle, index) => {
            const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
            const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                opacity={index === 0 ? "1" : "0.4"}
              />
            );
          })}
        </Svg>
      </Animated.View>
      
      {/* Animated Text */}
      {text && (
        <Animated.View style={dotAnimatedStyle}>
          <Text style={[styles.text, { color }]}>{text}</Text>
        </Animated.View>
      )}
      
      {/* Loading dots animation */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                transform: [
                  {
                    scale: interpolate(
                      (rotation.value + index * 120) % 360,
                      [0, 180, 360],
                      [0.8, 1.2, 0.8]
                    ),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});