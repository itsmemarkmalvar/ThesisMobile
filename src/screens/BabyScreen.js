import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';

// MeasurementItem Component
const MeasurementItem = ({ label, value }) => (
  <View style={styles.measurementItem}>
    <Text style={styles.measurementLabel}>{label}</Text>
    <Text style={styles.measurementValue}>{value}</Text>
  </View>
);

const BabyScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [babyData, setBabyData] = useState(null);

  useEffect(() => {
    fetchBabyData();
  }, []);

  const fetchBabyData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const response = await axios.get(`${API_URL}/baby`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setBabyData(response.data.data);
    } catch (error) {
      console.error('Error fetching baby data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestonesPress = () => {
    navigation.navigate('GrowthTracking', { initialTab: 'milestones' });
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
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back, Test Data</Text>
            <View style={styles.babyCard}>
              <Text style={styles.babyName}>Test Baby</Text>
              <View style={styles.measurementRow}>
                <Text style={styles.measurement}>📏 20.00 cm</Text>
                <Text style={styles.measurement}>⚖️ 20.00 kg</Text>
              </View>
            </View>
          </View>

          {/* Growth & Development Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth & Development</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity 
                style={styles.gridButton}
                onPress={() => navigation.navigate('GrowthTracking')}
              >
                <MaterialIcons name="show-chart" size={24} color="#4A90E2" />
                <Text style={styles.buttonText}>Growth</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.gridButton}
                onPress={() => navigation.navigate('GrowthTracking', { initialTab: 'milestones' })}
              >
                <MaterialIcons name="emoji-events" size={24} color="#4A90E2" />
                <Text style={styles.buttonText}>Milestones</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.gridButton}
                onPress={() => {/* Handle Development press */}}
              >
                <MaterialIcons name="child-care" size={24} color="#4A90E2" />
                <Text style={styles.buttonText}>Development</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ... rest of your sections */}
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  measurementsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  measurements: {
    gap: 10,
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  measurementLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  measurementValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  healthSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  health: {
    gap: 10,
  },
  milestonesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  milestones: {
    gap: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

export default BabyScreen; 