import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [babyData, setBabyData] = useState(null);

  useEffect(() => {
    fetchUserAndBabyData();
  }, []);

  const fetchUserAndBabyData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Fetch both user and baby data
      const [userResponse, babyResponse] = await Promise.all([
        axios.get(`${API_URL}/auth/user`, { headers }),
        axios.get(`${API_URL}/baby`, { headers })
      ]);

      setUserData(userResponse.data);
      setBabyData(babyResponse.data.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestonesPress = () => {
    navigation.navigate('GrowthTracking', { initialTab: 'milestones' });
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF9A9E', '#FAD0C4', '#FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <LinearGradient
              colors={['#FFF', '#F8F9FF']}
              style={styles.welcomeGradient}
            >
              <Text style={styles.welcomeText}>
                Welcome back,
                <Text style={styles.nameText}> {userData?.name}</Text>
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
                      <MaterialIcons name="fitness-center" size={16} color="#666" />
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
  nameText: {
    fontWeight: 'bold',
    color: '#4A90E2',
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