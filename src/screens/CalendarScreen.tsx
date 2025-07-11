import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HijriCalendarService, HijriDate, IslamicEvent } from '../services/hijriCalendarService';
import { COLORS } from '../utils/constants';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const CalendarScreen: React.FC = () => {
  const [currentHijriDate, setCurrentHijriDate] = useState<HijriDate | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<IslamicEvent[]>([]);
  const [monthEvents, setMonthEvents] = useState<IslamicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hijriCalendarService = HijriCalendarService.getInstance();

  const loadCalendarData = async () => {
    try {
      const hijriDate = hijriCalendarService.getCurrentHijriDate();
      const upcoming = hijriCalendarService.getUpcomingEvents(5);
      const monthlyEvents = hijriCalendarService.getEventsByMonth(hijriDate.month, hijriDate.year);

      setCurrentHijriDate(hijriDate);
      setUpcomingEvents(upcoming);
      setMonthEvents(monthlyEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCalendarData();
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return COLORS.success;
      case 'observance':
        return COLORS.primary;
      case 'commemoration':
        return COLORS.secondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return '🎉';
      case 'observance':
        return '🕌';
      case 'commemoration':
        return '📿';
      default:
        return '📅';
    }
  };

  const formatGregorianDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilEvent = (eventDate: Date): number => {
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const showEventDetails = (event: IslamicEvent) => {
    const daysUntil = getDaysUntilEvent(event.gregorianDate);
    const timeInfo = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;

    Alert.alert(
      event.title,
      `${event.description}\n\n${event.significance}\n\nDate: ${hijriCalendarService.formatHijriDate(event.date)}\nGregorian: ${formatGregorianDate(event.gregorianDate)}\n\n${timeInfo}`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading Islamic calendar..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Hijri Date */}
        {currentHijriDate && (
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.dateCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.dateCardTitle}>Today's Hijri Date</Text>
            <Text style={styles.hijriDate}>
              {hijriCalendarService.formatHijriDate(currentHijriDate)}
            </Text>
            <Text style={styles.gregorianDate}>
              {formatGregorianDate(new Date())}
            </Text>
            
            {/* Special Month Indicators */}
            {hijriCalendarService.isRamadan() && (
              <View style={styles.specialMonthBadge}>
                <Text style={styles.specialMonthText}>🌙 Ramadan Mubarak</Text>
              </View>
            )}
            {hijriCalendarService.isDhuAlHijjah() && (
              <View style={styles.specialMonthBadge}>
                <Text style={styles.specialMonthText}>🕋 Dhu al-Hijjah</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Upcoming Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Islamic Events</Text>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const daysUntil = getDaysUntilEvent(event.gregorianDate);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => showEventDetails(event)}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventIconContainer}>
                      <Text style={styles.eventIcon}>
                        {getEventTypeIcon(event.type)}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDescription}>{event.description}</Text>
                      <Text style={styles.eventDate}>
                        {hijriCalendarService.formatHijriDate(event.date, false)}
                      </Text>
                    </View>
                    <View style={styles.eventCountdown}>
                      <View
                        style={[
                          styles.countdownBadge,
                          { backgroundColor: getEventTypeColor(event.type) }
                        ]}
                      >
                        <Text style={styles.countdownText}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1 day' : `${daysUntil} days`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming events found</Text>
            </View>
          )}
        </View>

        {/* This Month's Events */}
        {currentHijriDate && monthEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              This Month ({currentHijriDate.monthName})
            </Text>
            {monthEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.monthEventCard}
                onPress={() => showEventDetails(event)}
              >
                <View style={styles.monthEventHeader}>
                  <Text style={styles.monthEventIcon}>
                    {getEventTypeIcon(event.type)}
                  </Text>
                  <View style={styles.monthEventInfo}>
                    <Text style={styles.monthEventTitle}>{event.title}</Text>
                    <Text style={styles.monthEventDate}>
                      {event.date.day} {event.date.monthName}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.monthEventTypeBadge,
                      { backgroundColor: getEventTypeColor(event.type) }
                    ]}
                  >
                    <Text style={styles.monthEventTypeText}>
                      {event.type}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Month Navigator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hijri Months</Text>
          <View style={styles.monthGrid}>
            {Array.from({ length: 12 }, (_, index) => {
              const monthNumber = index + 1;
              const monthName = hijriCalendarService.getMonthName(monthNumber);
              const isCurrentMonth = currentHijriDate?.month === monthNumber;
              
              return (
                <TouchableOpacity
                  key={monthNumber}
                  style={[
                    styles.monthButton,
                    isCurrentMonth && styles.currentMonthButton
                  ]}
                  onPress={() => {
                    if (currentHijriDate) {
                      const events = hijriCalendarService.getEventsByMonth(monthNumber, currentHijriDate.year);
                      if (events.length > 0) {
                        Alert.alert(
                          monthName,
                          events.map(e => `• ${e.title} (${e.date.day})`).join('\n'),
                          [{ text: 'OK' }]
                        );
                      } else {
                        Alert.alert(monthName, 'No special events in this month');
                      }
                    }
                  }}
                >
                  <Text style={[
                    styles.monthButtonText,
                    isCurrentMonth && styles.currentMonthButtonText
                  ]}>
                    {monthName}
                  </Text>
                  <Text style={[
                    styles.monthNumber,
                    isCurrentMonth && styles.currentMonthNumber
                  ]}>
                    {monthNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Islamic Calendar Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Islamic Calendar</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              The Islamic calendar, also known as the Hijri calendar, is a lunar calendar consisting of 12 months in a year of 354 or 355 days. It is used to determine Islamic holidays and religious observances.
            </Text>
            <Text style={styles.infoText}>
              The calendar began in 622 CE with the Hijra (migration) of Prophet Muhammad (PBUH) from Mecca to Medina.
            </Text>
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
  dateCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dateCardTitle: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.9,
  },
  hijriDate: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  gregorianDate: {
    color: COLORS.surface,
    fontSize: 14,
    opacity: 0.8,
  },
  specialMonthBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  specialMonthText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  eventCountdown: {
    alignItems: 'flex-end',
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  monthEventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthEventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  monthEventInfo: {
    flex: 1,
  },
  monthEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monthEventDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  monthEventTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  monthEventTypeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '30%',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentMonthButton: {
    backgroundColor: COLORS.primary,
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  currentMonthButtonText: {
    color: COLORS.surface,
  },
  monthNumber: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  currentMonthNumber: {
    color: COLORS.surface,
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});