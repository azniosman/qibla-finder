import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DhikrService, DhikrItem, DhikrSession, DhikrStats } from '../services/dhikrService';
import { COLORS } from '../utils/constants';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DhikrScreen: React.FC = () => {
  const [dhikrList, setDhikrList] = useState<DhikrItem[]>([]);
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem | null>(null);
  const [currentSession, setCurrentSession] = useState<DhikrSession | null>(null);
  const [stats, setStats] = useState<DhikrStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCounter, setShowCounter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Animation values
  const [scaleAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));

  // Form state for adding custom dhikr
  const [newDhikr, setNewDhikr] = useState({
    arabic: '',
    transliteration: '',
    translation: '',
    target: '33',
    benefit: ''
  });

  const dhikrService = DhikrService.getInstance();

  const loadData = useCallback(async () => {
    try {
      const [dhikr, dhikrStats] = await Promise.all([
        dhikrService.getDhikrList(),
        dhikrService.getStats()
      ]);
      
      setDhikrList(dhikr);
      setStats(dhikrStats);
    } catch (error) {
      console.error('Error loading dhikr data:', error);
      Alert.alert('Error', 'Failed to load dhikr data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDhikrSelect = async (dhikr: DhikrItem) => {
    try {
      setSelectedDhikr(dhikr);
      const session = await dhikrService.startSession(dhikr.id);
      setCurrentSession(session);
      setShowCounter(true);
      
      // Reset and start progress animation
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('Error starting dhikr session:', error);
      Alert.alert('Error', 'Failed to start dhikr session.');
    }
  };

  const handleCount = async () => {
    if (!selectedDhikr || !currentSession) return;

    try {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();

      // Increment count
      const newCount = await dhikrService.incrementCount(selectedDhikr.id);
      const updatedSession = {
        ...currentSession,
        count: newCount
      };
      
      setCurrentSession(updatedSession);
      await dhikrService.updateSession(updatedSession);

      // Update progress animation
      const progressPercentage = Math.min((newCount / selectedDhikr.target) * 100, 100);
      Animated.timing(progressAnim, {
        toValue: progressPercentage,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Update local dhikr list
      const updatedDhikrList = dhikrList.map(d => 
        d.id === selectedDhikr.id ? { ...d, count: newCount } : d
      );
      setDhikrList(updatedDhikrList);
      setSelectedDhikr({ ...selectedDhikr, count: newCount });

      // Check if target reached
      if (newCount >= selectedDhikr.target) {
        await dhikrService.completeSession(currentSession.id);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          '🎉 Target Reached!',
          `Congratulations! You have completed ${selectedDhikr.target} ${selectedDhikr.transliteration}.\n\n${selectedDhikr.benefit || 'May Allah accept your dhikr!'}`,
          [
            { text: 'Continue', onPress: () => {} },
            { text: 'Finish', onPress: handleFinishSession }
          ]
        );
      }

    } catch (error) {
      console.error('Error incrementing count:', error);
    }
  };

  const handleFinishSession = async () => {
    if (!currentSession) return;

    try {
      await dhikrService.completeSession(currentSession.id);
      await loadData(); // Reload stats
      setShowCounter(false);
      setSelectedDhikr(null);
      setCurrentSession(null);
      
      Alert.alert('Session Complete', 'Your dhikr session has been saved. May Allah accept your remembrance!');
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const handleReset = async () => {
    if (!selectedDhikr) return;

    Alert.alert(
      'Reset Count',
      'Are you sure you want to reset the count for this dhikr?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await dhikrService.resetDhikrCount(selectedDhikr.id);
              const updatedDhikrList = dhikrList.map(d => 
                d.id === selectedDhikr.id ? { ...d, count: 0 } : d
              );
              setDhikrList(updatedDhikrList);
              setSelectedDhikr({ ...selectedDhikr, count: 0 });
              
              if (currentSession) {
                const updatedSession = { ...currentSession, count: 0 };
                setCurrentSession(updatedSession);
                await dhikrService.updateSession(updatedSession);
              }
              
              progressAnim.setValue(0);
            } catch (error) {
              console.error('Error resetting count:', error);
            }
          }
        }
      ]
    );
  };

  const handleAddCustomDhikr = async () => {
    if (!newDhikr.arabic || !newDhikr.transliteration || !newDhikr.translation) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      await dhikrService.addCustomDhikr({
        arabic: newDhikr.arabic,
        transliteration: newDhikr.transliteration,
        translation: newDhikr.translation,
        target: parseInt(newDhikr.target) || 33,
        category: 'custom',
        benefit: newDhikr.benefit
      });

      await loadData();
      setShowAddModal(false);
      setNewDhikr({
        arabic: '',
        transliteration: '',
        translation: '',
        target: '33',
        benefit: ''
      });

      Alert.alert('Success', 'Custom dhikr added successfully!');
    } catch (error) {
      console.error('Error adding custom dhikr:', error);
      Alert.alert('Error', 'Failed to add custom dhikr. Please try again.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tasbih': return COLORS.primary;
      case 'tahmid': return COLORS.success;
      case 'takbir': return COLORS.accent;
      case 'istighfar': return COLORS.warning;
      case 'salawat': return COLORS.secondary;
      case 'dua': return COLORS.primary;
      case 'custom': return COLORS.textSecondary;
      default: return COLORS.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tasbih': return '📿';
      case 'tahmid': return '🤲';
      case 'takbir': return '🕌';
      case 'istighfar': return '💚';
      case 'salawat': return '☪️';
      case 'dua': return '🤍';
      case 'custom': return '✨';
      default: return '📿';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading dhikr..." />
        </View>
      </SafeAreaView>
    );
  }

  if (showCounter && selectedDhikr && currentSession) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[getCategoryColor(selectedDhikr.category), COLORS.background]}
          style={styles.counterContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Header */}
          <View style={styles.counterHeader}>
            <TouchableOpacity onPress={() => setShowCounter(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetButton}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Dhikr Text */}
          <View style={styles.dhikrTextContainer}>
            <Text style={styles.arabicText}>{selectedDhikr.arabic}</Text>
            <Text style={styles.transliterationText}>{selectedDhikr.transliteration}</Text>
            <Text style={styles.translationText}>{selectedDhikr.translation}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {selectedDhikr.count} / {selectedDhikr.target}
              </Text>
            </View>
          </View>

          {/* Counter */}
          <View style={styles.counterSection}>
            <Text style={styles.countDisplay}>{selectedDhikr.count}</Text>
            
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.countButton} onPress={handleCount}>
                <Text style={styles.countButtonText}>+1</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Actions */}
          <View style={styles.counterActions}>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinishSession}>
              <Text style={styles.finishButtonText}>Finish Session</Text>
            </TouchableOpacity>
          </View>

          {/* Benefit */}
          {selectedDhikr.benefit && (
            <View style={styles.benefitContainer}>
              <Text style={styles.benefitText}>{selectedDhikr.benefit}</Text>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dhikr Counter</Text>
          <Text style={styles.subtitle}>Remember Allah with tasbih</Text>
        </View>

        {/* Quick Stats */}
        {stats && (
          <TouchableOpacity style={styles.statsCard} onPress={() => setShowStatsModal(true)}>
            <Text style={styles.statsTitle}>Today's Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.todayCount}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalCount}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Dhikr List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Dhikr</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {dhikrList.map((dhikr) => (
            <TouchableOpacity
              key={dhikr.id}
              style={styles.dhikrCard}
              onPress={() => handleDhikrSelect(dhikr)}
            >
              <View style={styles.dhikrCardHeader}>
                <View style={styles.dhikrInfo}>
                  <View style={styles.dhikrTitleRow}>
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(dhikr.category)}
                    </Text>
                    <Text style={styles.dhikrTitle}>{dhikr.transliteration}</Text>
                  </View>
                  <Text style={styles.dhikrArabic}>{dhikr.arabic}</Text>
                  <Text style={styles.dhikrTranslation}>{dhikr.translation}</Text>
                </View>
                <View style={styles.dhikrStats}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(dhikr.category) }
                    ]}
                  >
                    <Text style={styles.categoryText}>
                      {dhikr.category}
                    </Text>
                  </View>
                  <Text style={styles.dhikrCount}>
                    {dhikr.count} / {dhikr.target}
                  </Text>
                </View>
              </View>
              
              {/* Progress bar */}
              <View style={styles.dhikrProgressBar}>
                <View
                  style={[
                    styles.dhikrProgressFill,
                    { 
                      width: `${Math.min((dhikr.count / dhikr.target) * 100, 100)}%`,
                      backgroundColor: getCategoryColor(dhikr.category)
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Custom Dhikr Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Dhikr</Text>
            
            <Text style={styles.inputLabel}>Arabic Text *</Text>
            <TextInput
              style={styles.textInput}
              value={newDhikr.arabic}
              onChangeText={(text) => setNewDhikr({ ...newDhikr, arabic: text })}
              placeholder="Enter Arabic text"
            />

            <Text style={styles.inputLabel}>Transliteration *</Text>
            <TextInput
              style={styles.textInput}
              value={newDhikr.transliteration}
              onChangeText={(text) => setNewDhikr({ ...newDhikr, transliteration: text })}
              placeholder="Enter transliteration"
            />

            <Text style={styles.inputLabel}>Translation *</Text>
            <TextInput
              style={styles.textInput}
              value={newDhikr.translation}
              onChangeText={(text) => setNewDhikr({ ...newDhikr, translation: text })}
              placeholder="Enter English translation"
            />

            <Text style={styles.inputLabel}>Target Count</Text>
            <TextInput
              style={styles.textInput}
              value={newDhikr.target}
              onChangeText={(text) => setNewDhikr({ ...newDhikr, target: text })}
              placeholder="33"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Benefit (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newDhikr.benefit}
              onChangeText={(text) => setNewDhikr({ ...newDhikr, benefit: text })}
              placeholder="Enter the benefit or significance"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddCustomDhikr}
              >
                <Text style={styles.modalConfirmText}>Add Dhikr</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      {stats && (
        <Modal
          visible={showStatsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStatsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Dhikr Statistics</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.totalSessions}</Text>
                  <Text style={styles.statsGridLabel}>Total Sessions</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.totalCount}</Text>
                  <Text style={styles.statsGridLabel}>Total Count</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.weeklyCount}</Text>
                  <Text style={styles.statsGridLabel}>This Week</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.monthlyCount}</Text>
                  <Text style={styles.statsGridLabel}>This Month</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.averagePerSession}</Text>
                  <Text style={styles.statsGridLabel}>Avg/Session</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.longestStreak}</Text>
                  <Text style={styles.statsGridLabel}>Best Streak</Text>
                </View>
              </View>

              <View style={styles.favoriteSection}>
                <Text style={styles.favoriteLabel}>Most Used Dhikr:</Text>
                <Text style={styles.favoriteValue}>{stats.mostUsedDhikr}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowStatsModal(false)}
              >
                <Text style={styles.modalConfirmText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  statsCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dhikrCard: {
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
  dhikrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dhikrInfo: {
    flex: 1,
    marginRight: 12,
  },
  dhikrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dhikrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dhikrArabic: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'right',
  },
  dhikrTranslation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  dhikrStats: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dhikrCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dhikrProgressBar: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dhikrProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Counter Screen Styles
  counterContainer: {
    flex: 1,
    padding: 20,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  resetButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  dhikrTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  arabicText: {
    fontSize: 32,
    color: COLORS.surface,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '300',
  },
  transliterationText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 8,
    textAlign: 'center',
  },
  translationText: {
    fontSize: 16,
    color: COLORS.surface,
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
  },
  progressSection: {
    marginBottom: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  countDisplay: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 30,
  },
  countButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  counterActions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  finishButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  benefitContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  benefitText: {
    color: COLORS.surface,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Modal Styles
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsGridItem: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statsGridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statsGridLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  favoriteSection: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  favoriteLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  favoriteValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});