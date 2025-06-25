import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { AppSettings, NotificationSettings } from '../types';
import { COLORS, CALCULATION_METHODS } from '../utils/constants';

const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: 'ISNA',
  notificationSound: 'adhan1',
  notificationAdvance: 15,
  theme: 'light',
  language: 'en',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
  },
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  advanceMinutes: 15,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
  },
};

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  const storageService = StorageService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await storageService.getSettings();
      const savedNotifications = await storageService.getNotificationSettings();
      
      if (savedSettings) {
        setSettings(savedSettings);
      }
      
      if (savedNotifications) {
        setNotifications(savedNotifications);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await storageService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const saveNotificationSettings = async (newNotifications: NotificationSettings) => {
    try {
      await storageService.saveNotificationSettings(newNotifications);
      setNotifications(newNotifications);
      
      // Update notification service
      if (newNotifications.enabled) {
        await notificationService.initialize();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    }
  };

  const handleCalculationMethodPress = () => {
    const methods = Object.entries(CALCULATION_METHODS);
    const options = methods.map(([key, name]) => ({
      text: name,
      onPress: () => saveSettings({ ...settings, calculationMethod: key as keyof typeof CALCULATION_METHODS }),
    }));

    Alert.alert(
      'Prayer Calculation Method',
      'Choose the calculation method for prayer times:',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNotificationSoundPress = () => {
    const sounds = [
      { key: 'adhan1', name: 'Adhan 1' },
      { key: 'adhan2', name: 'Adhan 2' },
      { key: 'bell', name: 'Bell' },
      { key: 'none', name: 'None' },
    ] as const;

    const options = sounds.map(({ key, name }) => ({
      text: name,
      onPress: () => saveSettings({ ...settings, notificationSound: key }),
    }));

    Alert.alert(
      'Notification Sound',
      'Choose the notification sound:',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAdvanceTimePress = () => {
    const times = [5, 10, 15, 20, 30];
    const options = times.map((time) => ({
      text: `${time} minutes`,
      onPress: () => {
        saveSettings({ ...settings, notificationAdvance: time });
        saveNotificationSettings({ ...notifications, advanceMinutes: time });
      },
    }));

    Alert.alert(
      'Notification Advance Time',
      'Get notified this many minutes before prayer time:',
      [
        ...options,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all prayer records, settings, and cached data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              await loadSettings();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Prayer Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Settings</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={handleCalculationMethodPress}>
            <Text style={styles.settingLabel}>Calculation Method</Text>
            <Text style={styles.settingValue}>
              {CALCULATION_METHODS[settings.calculationMethod]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notifications.enabled}
              onValueChange={(value) =>
                saveNotificationSettings({ ...notifications, enabled: value })
              }
              trackColor={{ false: COLORS.background, true: COLORS.primary }}
              thumbColor={notifications.enabled ? COLORS.surface : COLORS.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleNotificationSoundPress}>
            <Text style={styles.settingLabel}>Notification Sound</Text>
            <Text style={styles.settingValue}>
              {settings.notificationSound === 'adhan1' && 'Adhan 1'}
              {settings.notificationSound === 'adhan2' && 'Adhan 2'}
              {settings.notificationSound === 'bell' && 'Bell'}
              {settings.notificationSound === 'none' && 'None'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleAdvanceTimePress}>
            <Text style={styles.settingLabel}>Advance Time</Text>
            <Text style={styles.settingValue}>
              {settings.notificationAdvance} minutes
            </Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Switch
              value={notifications.sound}
              onValueChange={(value) =>
                saveNotificationSettings({ ...notifications, sound: value })
              }
              trackColor={{ false: COLORS.background, true: COLORS.primary }}
              thumbColor={notifications.sound ? COLORS.surface : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Switch
              value={notifications.vibration}
              onValueChange={(value) =>
                saveNotificationSettings({ ...notifications, vibration: value })
              }
              trackColor={{ false: COLORS.background, true: COLORS.primary }}
              thumbColor={notifications.vibration ? COLORS.surface : COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerRow} onPress={clearAllData}>
            <Text style={styles.dangerLabel}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Developer</Text>
            <Text style={styles.settingValue}>Qibla Finder Team</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    padding: 15,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  dangerRow: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dangerLabel: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '500',
  },
});