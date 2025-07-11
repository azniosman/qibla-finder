import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { QiblaScreen } from '../screens/QiblaScreen';
import { PrayerTimesScreen } from '../screens/PrayerTimesScreen';
import { QadaScreen } from '../screens/QadaScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DhikrScreen } from '../screens/DhikrScreen';
import { AsmaUlHusnaScreen } from '../screens/AsmaUlHusnaScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

// Simple icon component using text emojis
const TabIcon = ({ focused, emoji }: { focused: boolean; emoji: string }) => (
  <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
    {emoji}
  </Text>
);

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.background,
          paddingVertical: 2,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🏠" />
          ),
          headerTitle: 'Qibla Finder',
        }}
      />
      <Tab.Screen
        name="Prayer Times"
        component={PrayerTimesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🕌" />
          ),
          headerTitle: 'Prayer Times',
        }}
      />
      <Tab.Screen
        name="Qibla"
        component={QiblaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🧭" />
          ),
          headerTitle: 'Qibla Direction',
        }}
      />
      <Tab.Screen
        name="Qada"
        component={QadaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🔄" />
          ),
          headerTitle: 'Qada Management',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📅" />
          ),
          headerTitle: 'Islamic Calendar',
        }}
      />
      <Tab.Screen
        name="Dhikr"
        component={DhikrScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📿" />
          ),
          headerTitle: 'Dhikr Counter',
        }}
      />
      <Tab.Screen
        name="Names"
        component={AsmaUlHusnaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="☪️" />
          ),
          headerTitle: '99 Names of Allah',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="⚙️" />
          ),
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};