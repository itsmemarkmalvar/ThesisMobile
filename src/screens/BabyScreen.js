import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

// MeasurementItem Component
const MeasurementItem = ({ label, value }) => (
  <View style={styles.measurementItem}>
    <Text style={styles.measurementLabel}>{label}</Text>
    <Text style={styles.measurementValue}>{value}</Text>
  </View>
);

const BabyScreen = () => {
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
          {babyData && (
            <>
              <View style={styles.infoSection}>
                <Text style={styles.name}>{babyData.name}</Text>
                <Text style={styles.detail}>Gender: {babyData.gender}</Text>
                <Text style={styles.detail}>
                  Birth Date: {new Date(babyData.birth_date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.measurementsSection}>
                <Text style={styles.sectionTitle}>Current Measurements</Text>
                <View style={styles.measurements}>
                  <MeasurementItem label="Height" value={`${babyData.height} cm`} />
                  <MeasurementItem label="Weight" value={`${babyData.weight} kg`} />
                  <MeasurementItem label="Head Size" value={`${babyData.head_size} cm`} />
                </View>
              </View>
            </>
          )}
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
});

export default BabyScreen; 