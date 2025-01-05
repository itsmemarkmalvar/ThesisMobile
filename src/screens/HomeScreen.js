import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { useBaby } from '../context/BabyContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

const QuickActionButton = ({ icon, label, onPress, delay, color }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pressAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: delay * 100,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[
      styles.actionButtonContainer,
      {
        transform: [
          { scale: scaleAnim },
          { scale: pressAnim }
        ],
      }
    ]}>
      <Pressable
        style={[styles.actionButton, { backgroundColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <MaterialIcons name={icon} size={24} color="#FFF" />
        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const CategorySection = ({ title, actions, startDelay = 0, color }) => (
  <View style={styles.categorySection}>
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <QuickActionButton
            key={action.label}
            {...action}
            delay={startDelay + index}
            color={color}
          />
        ))}
      </View>
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { babyData, loading, error, fetchBabyData } = useBaby();
  const [refreshing, setRefreshing] = React.useState(false);
  const [userData, setUserData] = React.useState(null);
  const initialFetchAttempted = React.useRef(false);

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialFetchAttempted.current) {
        initialFetchAttempted.current = true;
        try {
          await fetchBabyData(true); // Force fetch on initial load
        } catch (error) {
          console.error('Initial data fetch error:', error);
        }
      }
    };

    loadInitialData();
  }, []);

  // Add focus listener for navigation - only fetch if data was updated
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(r => r.name === 'Home')?.params;
      if (params?.dataUpdated) {
        fetchBabyData(true); // Force fetch when data was updated
        navigation.setParams({ dataUpdated: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBabyData(true); // Force fetch on manual refresh
    } finally {
      setRefreshing(false);
    }
  }, [fetchBabyData]);

  const handleRetry = useCallback(async () => {
    try {
      await fetchBabyData(true); // Force fetch on retry
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [fetchBabyData]);

  // Add function to fetch user data
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Add useEffect to fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const categories = {
    growth: {
      title: "Growth & Development",
      color: '#4A90E2',
      actions: [
        {
          icon: 'show-chart',
          label: 'Growth',
          onPress: () => navigation.navigate('GrowthTracking'),
        },
        {
          icon: 'remove-red-eye',
          label: 'Milestones',
          onPress: () => navigation.navigate('GrowthTracking', { initialTab: 'milestones' }),
        },
        {
          icon: 'psychology',
          label: 'Development',
          onPress: () => navigation.navigate('Development'),
        },
      ]
    },
    health: {
      title: "Health & Care",
      color: '#FF6B6B',
      actions: [
        {
          icon: 'medical-services',
          label: 'Health',
          onPress: () => navigation.navigate('Health'),
        },
        {
          icon: 'event-available',
          label: 'Vaccination',
          onPress: () => navigation.navigate('Immunization'),
        },
        {
          icon: 'local-hospital',
          label: 'Medicine',
          onPress: () => navigation.navigate('Medicine'),
        },
      ]
    },
    daily: {
      title: "Daily Activities",
      color: '#4CAF50',
      actions: [
        {
          icon: 'restaurant',
          label: 'Feeding',
          onPress: () => navigation.navigate('Feeding'),
        },
        {
          icon: 'night-shelter',
          label: 'Sleep',
          onPress: () => navigation.navigate('Sleep'),
        },
        {
          icon: 'baby-changing-station',
          label: 'Diaper',
          onPress: () => navigation.navigate('Diaper'),
        },
      ]
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error || !babyData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>
              {error || 'No baby data available. Please add your baby\'s information.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <LinearGradient
              colors={['#FFF', '#F8F9FF']}
              style={styles.welcomeGradient}
            >
              <Text style={styles.welcomeText}>
                Welcome back{userData?.name ? `, ${userData.name}` : ''}
              </Text>
              {babyData && (
                <View style={styles.babyInfo}>
                  <Text style={styles.babyName}>{babyData.name}</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <MaterialIcons name="straighten" size={16} color="#666" />
                      <Text style={styles.statText}>{babyData.height} cm</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <MaterialIcons name="monitor-weight" size={16} color="#666" />
                      <Text style={styles.statText}>{babyData.weight} kg</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Categories */}
          {Object.entries(categories).map(([key, category], index) => (
            <CategorySection
              key={key}
              title={category.title}
              actions={category.actions}
              startDelay={index * 3}
              color={category.color}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeCard: {
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    color: '#333',
  },
  babyInfo: {
    marginTop: 15,
  },
  babyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#DDD',
    marginHorizontal: 15,
  },
  categorySection: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryContainer: {
    padding: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  actionButtonContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen; 