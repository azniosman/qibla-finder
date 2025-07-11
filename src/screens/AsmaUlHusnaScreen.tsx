import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AsmaUlHusnaService, AsmaUlHusnaName, AsmaUlHusnaStats } from '../services/asmaUlHusnaService';
import { COLORS } from '../utils/constants';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AsmaUlHusnaScreen: React.FC = () => {
  const [allNames, setAllNames] = useState<AsmaUlHusnaName[]>([]);
  const [filteredNames, setFilteredNames] = useState<AsmaUlHusnaName[]>([]);
  const [favoriteNames, setFavoriteNames] = useState<AsmaUlHusnaName[]>([]);
  const [nameOfTheDay, setNameOfTheDay] = useState<AsmaUlHusnaName | null>(null);
  const [stats, setStats] = useState<AsmaUlHusnaStats | null>(null);
  const [selectedName, setSelectedName] = useState<AsmaUlHusnaName | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'all' | 'favorites' | 'daily'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const asmaService = AsmaUlHusnaService.getInstance();

  const loadData = useCallback(async () => {
    try {
      const [names, favorites, dailyName, asmaStats] = await Promise.all([
        asmaService.getAllNames(),
        asmaService.getFavoriteNames(),
        asmaService.getNameOfTheDay(),
        asmaService.getStats()
      ]);

      setAllNames(names);
      setFilteredNames(names);
      setFavoriteNames(favorites);
      setNameOfTheDay(dailyName);
      setStats(asmaStats);
    } catch (error) {
      console.error('Error loading Asma ul Husna data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, allNames, currentTab]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      switch (currentTab) {
        case 'all':
          setFilteredNames(allNames);
          break;
        case 'favorites':
          setFilteredNames(favoriteNames);
          break;
        case 'daily':
          setFilteredNames(nameOfTheDay ? [nameOfTheDay] : []);
          break;
      }
      return;
    }

    try {
      const searchResults = await asmaService.searchNames(query);
      let results = searchResults;

      if (currentTab === 'favorites') {
        results = searchResults.filter(name => name.isFavorite);
      } else if (currentTab === 'daily' && nameOfTheDay) {
        results = searchResults.filter(name => name.number === nameOfTheDay.number);
      }

      setFilteredNames(results);
    } catch (error) {
      console.error('Error searching names:', error);
    }
  };

  const handleTabChange = (tab: 'all' | 'favorites' | 'daily') => {
    setCurrentTab(tab);
    setSearchQuery('');
    
    switch (tab) {
      case 'all':
        setFilteredNames(allNames);
        break;
      case 'favorites':
        setFilteredNames(favoriteNames);
        break;
      case 'daily':
        setFilteredNames(nameOfTheDay ? [nameOfTheDay] : []);
        break;
    }
  };

  const handleToggleFavorite = async (nameItem: AsmaUlHusnaName) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await asmaService.toggleFavorite(nameItem.number);
      await loadData(); // Reload to update favorites
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const handleRecitePress = async (nameItem: AsmaUlHusnaName) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await asmaService.recordRecitation(nameItem.number);
      
      // Update stats immediately
      const newStats = await asmaService.getStats();
      setStats(newStats);
      
      Alert.alert(
        'Recitation Recorded',
        `You have recited ${nameItem.transliteration}. May Allah accept your dhikr!`,
        [{ text: 'Continue' }]
      );
    } catch (error) {
      console.error('Error recording recitation:', error);
      Alert.alert('Error', 'Failed to record recitation. Please try again.');
    }
  };

  const handleNamePress = (nameItem: AsmaUlHusnaName) => {
    setSelectedName(nameItem);
    setShowNameModal(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTabButtonStyle = (tab: string) => [
    styles.tabButton,
    currentTab === tab && styles.activeTabButton
  ];

  const getTabTextStyle = (tab: string) => [
    styles.tabText,
    currentTab === tab && styles.activeTabText
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" text="Loading Asma ul Husna..." />
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Asma ul Husna</Text>
          <Text style={styles.subtitle}>The 99 Beautiful Names of Allah</Text>
        </View>

        {/* Name of the Day */}
        {nameOfTheDay && (
          <TouchableOpacity 
            style={styles.dailyNameCard}
            onPress={() => handleNamePress(nameOfTheDay)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.dailyNameGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.dailyNameLabel}>Name of the Day</Text>
              <Text style={styles.dailyNameArabic}>{nameOfTheDay.arabic}</Text>
              <Text style={styles.dailyNameTransliteration}>{nameOfTheDay.transliteration}</Text>
              <Text style={styles.dailyNameTranslation}>{nameOfTheDay.translation}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats Card */}
        {stats && (
          <TouchableOpacity style={styles.statsCard} onPress={() => setShowStatsModal(true)}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.todayRecitations}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.favoriteCount}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalRecitations}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completedSessions}</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search names..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={getTabButtonStyle('all')}
            onPress={() => handleTabChange('all')}
          >
            <Text style={getTabTextStyle('all')}>All Names</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getTabButtonStyle('favorites')}
            onPress={() => handleTabChange('favorites')}
          >
            <Text style={getTabTextStyle('favorites')}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getTabButtonStyle('daily')}
            onPress={() => handleTabChange('daily')}
          >
            <Text style={getTabTextStyle('daily')}>Daily</Text>
          </TouchableOpacity>
        </View>

        {/* Names List */}
        <View style={styles.namesList}>
          {filteredNames.length > 0 ? (
            filteredNames.map((nameItem) => (
              <TouchableOpacity
                key={nameItem.number}
                style={styles.nameCard}
                onPress={() => handleNamePress(nameItem)}
              >
                <View style={styles.nameCardContent}>
                  <View style={styles.nameNumber}>
                    <Text style={styles.numberText}>{nameItem.number}</Text>
                  </View>
                  
                  <View style={styles.nameInfo}>
                    <Text style={styles.nameArabic}>{nameItem.arabic}</Text>
                    <Text style={styles.nameTransliteration}>{nameItem.transliteration}</Text>
                    <Text style={styles.nameTranslation}>{nameItem.translation}</Text>
                  </View>

                  <View style={styles.nameActions}>
                    <TouchableOpacity
                      style={[
                        styles.favoriteButton,
                        nameItem.isFavorite && styles.favoriteButtonActive
                      ]}
                      onPress={() => handleToggleFavorite(nameItem)}
                    >
                      <Text style={[
                        styles.favoriteIcon,
                        nameItem.isFavorite && styles.favoriteIconActive
                      ]}>
                        {nameItem.isFavorite ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.reciteButton}
                      onPress={() => handleRecitePress(nameItem)}
                    >
                      <Text style={styles.reciteButtonText}>Recite</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No names found matching your search.' : 'No names to display.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Name Detail Modal */}
      {selectedName && (
        <Modal
          visible={showNameModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNameModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalNumber}>{selectedName.number}</Text>
                <TouchableOpacity onPress={() => setShowNameModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalArabic}>{selectedName.arabic}</Text>
              <Text style={styles.modalTransliteration}>{selectedName.transliteration}</Text>
              <Text style={styles.modalTranslation}>{selectedName.translation}</Text>
              
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningTitle}>Meaning:</Text>
                <Text style={styles.meaningText}>{selectedName.meaning}</Text>
              </View>

              {selectedName.benefit && (
                <View style={styles.benefitContainer}>
                  <Text style={styles.benefitTitle}>Benefit:</Text>
                  <Text style={styles.benefitText}>{selectedName.benefit}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalFavoriteButton}
                  onPress={() => handleToggleFavorite(selectedName)}
                >
                  <Text style={styles.modalFavoriteText}>
                    {selectedName.isFavorite ? '💖 Remove from Favorites' : '🤍 Add to Favorites'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalReciteButton}
                  onPress={() => {
                    handleRecitePress(selectedName);
                    setShowNameModal(false);
                  }}
                >
                  <Text style={styles.modalReciteText}>📿 Record Recitation</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Asma ul Husna Statistics</Text>
                <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.totalRecitations}</Text>
                  <Text style={styles.statsGridLabel}>Total Recitations</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.completedSessions}</Text>
                  <Text style={styles.statsGridLabel}>Complete Sessions</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.currentStreak}</Text>
                  <Text style={styles.statsGridLabel}>Current Streak</Text>
                </View>
                <View style={styles.statsGridItem}>
                  <Text style={styles.statsGridValue}>{stats.longestStreak}</Text>
                  <Text style={styles.statsGridLabel}>Longest Streak</Text>
                </View>
              </View>

              <View style={styles.favoriteSection}>
                <Text style={styles.favoriteLabel}>Most Recited Name:</Text>
                <Text style={styles.favoriteValue}>{stats.mostRecitedName}</Text>
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
    textAlign: 'center',
  },
  dailyNameCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dailyNameGradient: {
    padding: 20,
    alignItems: 'center',
  },
  dailyNameLabel: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.9,
  },
  dailyNameArabic: {
    color: COLORS.surface,
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  dailyNameTransliteration: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  dailyNameTranslation: {
    color: COLORS.surface,
    fontSize: 16,
    opacity: 0.9,
    fontStyle: 'italic',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
  },
  namesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  nameNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  numberText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameInfo: {
    flex: 1,
  },
  nameArabic: {
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'right',
  },
  nameTransliteration: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  nameTranslation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  nameActions: {
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    marginBottom: 8,
  },
  favoriteButtonActive: {
    backgroundColor: 'transparent',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  favoriteIconActive: {
    transform: [{ scale: 1.2 }],
  },
  reciteButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reciteButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Modal styles
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  modalArabic: {
    fontSize: 36,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTransliteration: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTranslation: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  meaningContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  meaningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  benefitContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalActions: {
    gap: 12,
  },
  modalFavoriteButton: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalFavoriteText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalReciteButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalReciteText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
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