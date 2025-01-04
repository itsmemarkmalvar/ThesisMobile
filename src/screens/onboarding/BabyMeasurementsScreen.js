import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config';

const MeasurementInput = React.memo(({ label, value, unit, onChange, placeholder, inputRef, fieldName }) => {
  console.log(`Rendering MeasurementInput - ${fieldName}, value: ${value}`);
  
  const handleTextChange = (text) => {
    // Only allow numbers and one decimal point
    const numericText = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = numericText.split('.');
    const sanitizedText = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    onChange(sanitizedText);
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.measurementInput}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
});

const BabyMeasurementsScreen = ({ navigation, route }) => {
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    headSize: '',
  });
  
  // Create refs for each input
  const heightInputRef = useRef(null);
  const weightInputRef = useRef(null);
  const headSizeInputRef = useRef(null);

  const { babyName, gender, birthDate } = route.params;

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Initial token check:', !!token);
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please login again to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Auth')
            }
          ]
        );
      }
    };
    
    checkToken();
  }, []);

  const handleComplete = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token when saving:', token ? token.substring(0, 10) + '...' : 'No token');
      
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please login again to continue.',
          [{ text: 'OK', onPress: () => navigation.replace('Auth') }]
        );
        return;
      }

      const babyData = {
        name: babyName,
        gender,
        birth_date: new Date(birthDate).toISOString().split('T')[0],
        height: parseFloat(measurements.height),
        weight: parseFloat(measurements.weight),
        head_size: parseFloat(measurements.headSize),
      };

      console.log('Sending baby data:', babyData);
      console.log('To API URL:', `${API_URL}/baby`);

      const response = await axios.post(`${API_URL}/baby`, babyData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      console.log('API Response:', response.data);

      if (response.data) {
        navigation.replace('MainApp');
      }
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Please login again to continue.',
          [{ text: 'OK', onPress: () => navigation.replace('Auth') }]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to save baby information: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const updateMeasurement = useCallback((field, value) => {
    console.log(`updateMeasurement called - field: ${field}, value: ${value}`);
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleHeightChange = useCallback((value) => {
    console.log('Height change:', value);
    updateMeasurement('height', value);
  }, [updateMeasurement]);

  const handleWeightChange = useCallback((value) => {
    console.log('Weight change:', value);
    updateMeasurement('weight', value);
  }, [updateMeasurement]);

  const handleHeadSizeChange = useCallback((value) => {
    console.log('Head size change:', value);
    updateMeasurement('headSize', value);
  }, [updateMeasurement]);

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.content}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
                <Text style={styles.stepText}>Step 3 of 3</Text>
              </View>

              <Text style={styles.title}>Baby's Measurements</Text>
              <Text style={styles.subtitle}>Enter your baby's current measurements</Text>

              <MeasurementInput
                label="Height"
                value={measurements.height}
                unit="cm"
                onChange={handleHeightChange}
                placeholder="0.0"
                inputRef={heightInputRef}
                fieldName="height"
              />

              <MeasurementInput
                label="Weight"
                value={measurements.weight}
                unit="kg"
                onChange={handleWeightChange}
                placeholder="0.0"
                inputRef={weightInputRef}
                fieldName="weight"
              />

              <MeasurementInput
                label="Head Size"
                value={measurements.headSize}
                unit="cm"
                onChange={handleHeadSizeChange}
                placeholder="0.0"
                inputRef={headSizeInputRef}
                fieldName="headSize"
              />

              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
              >
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 20 : 0,
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  stepText: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    backgroundColor: '#FFF',
  },
  unit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BabyMeasurementsScreen; 