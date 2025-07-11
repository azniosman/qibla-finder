import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QadaService } from '../services/qadaService';
import { QadaCount, QadaPlan } from '../types';
import { COLORS, PRAYER_NAMES } from '../utils/constants';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const QadaScreen: React.FC = () => {
  const [qadaCount, setQadaCount] = useState<QadaCount>({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  });
  const [qadaPlan, setQadaPlan] = useState<QadaPlan | null>(null);
  const [statistics, setStatistics] = useState({
    totalQada: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    averagePerDay: 0,
    priorityPrayer: null as keyof QadaCount | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<keyof QadaCount>('fajr');
  const [logCount, setLogCount] = useState('1');

  const qadaService = QadaService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [count, plan, stats] = await Promise.all([
        qadaService.getQadaCount(),
        qadaService.getQadaPlan(),
        qadaService.getQadaStatistics(),
      ]);
      
      setQadaCount(count);
      setQadaPlan(plan);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading qada data:', error);
      Alert.alert('Error', 'Failed to load qada data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogQada = async () => {
    try {
      const count = parseInt(logCount);
      if (isNaN(count) || count <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid number of prayers.');
        return;
      }

      await qadaService.logQadaPrayer(selectedPrayer, count);
      await loadData();
      setShowLogModal(false);
      setLogCount('1');
      
      Alert.alert('Success', `Logged ${count} ${PRAYER_NAMES[selectedPrayer]} qada prayer(s)!`);
    } catch (error) {
      console.error('Error logging qada:', error);
      Alert.alert('Error', 'Failed to log qada prayer. Please try again.');
    }
  };

  const handleCreatePlan = async () => {
    try {
      const recommendedPlan = await qadaService.generateRecommendedPlan();
      setQadaPlan(recommendedPlan);
      await qadaService.saveQadaPlan(recommendedPlan);
      setShowPlanModal(false);
      
      Alert.alert(
        'Plan Created!',
        `Daily target: ${recommendedPlan.dailyTarget} prayers\nPriority: ${PRAYER_NAMES[recommendedPlan.priorityPrayer]}`
      );
    } catch (error) {
      console.error('Error creating qada plan:', error);
      Alert.alert('Error', 'Failed to create qada plan. Please try again.');
    }
  };

  const getProgressPercentage = (): number => {
    if (!qadaPlan || qadaPlan.dailyTarget === 0) return 0;
    return Math.min((qadaPlan.completedToday / qadaPlan.dailyTarget) * 100, 100);
  };

  const getPrayerCardStyle = (prayer: keyof QadaCount) => {
    const count = qadaCount[prayer];
    if (count === 0) return [styles.prayerCard, styles.prayerCardComplete];
    if (count < 10) return [styles.prayerCard, styles.prayerCardLow];
    if (count < 50) return [styles.prayerCard, styles.prayerCardMedium];
    return [styles.prayerCard, styles.prayerCardHigh];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading qada data..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Qada Management</Text>
          <Text style={styles.subtitle}>Track and plan your missed prayers</Text>
        </View>

        {/* Total Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Total Qada Prayers</Text>
          <Text style={styles.overviewCount}>{statistics.totalQada}</Text>
          {statistics.priorityPrayer && (
            <Text style={styles.overviewSubtext}>
              Priority: {PRAYER_NAMES[statistics.priorityPrayer]}
            </Text>
          )}
        </View>

        {/* Daily Plan Progress */}
        {qadaPlan && (
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Today's Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {qadaPlan.completedToday} / {qadaPlan.dailyTarget} prayers
              </Text>
            </View>
          </View>
        )}

        {/* Prayer Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Breakdown</Text>
          <View style={styles.prayerGrid}>
            {Object.entries(PRAYER_NAMES).map(([prayer, displayName]) => (
              <TouchableOpacity
                key={prayer}
                style={getPrayerCardStyle(prayer as keyof QadaCount)}
                onPress={() => {
                  setSelectedPrayer(prayer as keyof QadaCount);
                  setShowLogModal(true);
                }}
              >
                <Text style={styles.prayerName}>{displayName}</Text>
                <Text style={styles.prayerCount}>
                  {qadaCount[prayer as keyof QadaCount]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowLogModal(true)}
          >
            <Text style={styles.primaryButtonText}>Log Qada Prayer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowPlanModal(true)}
          >
            <Text style={styles.secondaryButtonText}>
              {qadaPlan ? 'Update Plan' : 'Create Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.completedThisWeek}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.completedThisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.averagePerDay}</Text>
              <Text style={styles.statLabel}>Daily Target</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Log Qada Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Qada Prayer</Text>
            
            <Text style={styles.modalLabel}>Prayer Type:</Text>
            <View style={styles.prayerSelector}>
              {Object.entries(PRAYER_NAMES).map(([prayer, displayName]) => (
                <TouchableOpacity
                  key={prayer}
                  style={[
                    styles.prayerOption,
                    selectedPrayer === prayer && styles.prayerOptionSelected,
                  ]}
                  onPress={() => setSelectedPrayer(prayer as keyof QadaCount)}
                >
                  <Text
                    style={[
                      styles.prayerOptionText,
                      selectedPrayer === prayer && styles.prayerOptionTextSelected,
                    ]}
                  >
                    {displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Number of Prayers:</Text>
            <TextInput
              style={styles.textInput}
              value={logCount}
              onChangeText={setLogCount}
              keyboardType="numeric"
              placeholder="1"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleLogQada}
              >
                <Text style={styles.modalConfirmText}>Log Prayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qada Plan</Text>
            <Text style={styles.modalDescription}>
              Create a daily plan to systematically complete your qada prayers.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreatePlan}
              >
                <Text style={styles.modalConfirmText}>Create Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  overviewCard: {
    backgroundColor: COLORS.primary,
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
  overviewTitle: {
    fontSize: 16,
    color: COLORS.surface,
    marginBottom: 8,
  },
  overviewCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prayerCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerCardComplete: {
    backgroundColor: COLORS.success,
  },
  prayerCardLow: {
    backgroundColor: COLORS.warning,
  },
  prayerCardMedium: {
    backgroundColor: COLORS.secondary,
  },
  prayerCardHigh: {
    backgroundColor: COLORS.error,
  },
  prayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 4,
  },
  prayerCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  prayerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  prayerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  prayerOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  prayerOptionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  prayerOptionTextSelected: {
    color: COLORS.surface,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});