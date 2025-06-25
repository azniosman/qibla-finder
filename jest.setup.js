// Jest setup for React Native testing
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-location');
jest.mock('expo-sensors');
jest.mock('expo-notifications');
jest.mock('expo-haptics');
jest.mock('@react-native-async-storage/async-storage');

// Silence console warnings during tests
console.warn = jest.fn();
console.error = jest.fn();