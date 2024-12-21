import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const BabyMeasurementsScreen = ({ navigation, route }) => {
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    headSize: '',
  });

  const { babyName, gender, birthDate } = route.params;

  const validateMeasurements = () => {
    const height = parseFloat(measurements.height);
    const weight = parseFloat(measurements.weight);
    const headSize = parseFloat(measurements.headSize);

    if (!height || height < 20 || height > 120) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 20-120 cm');
      return false;
    }
    if (!weight || weight < 1 || weight > 30) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 1-30 kg');
      return false;
    }
    if (!headSize || headSize < 20 || headSize > 60) {
      Alert.alert('Invalid Head Size', 'Please enter a valid head size between 20-60 cm');
      return false;
    }
    return true;
  };

  const handleComplete = () => {
    if (!validateMeasurements()) return;

    // Here you would save the complete baby data
    const babyData = {
      name: babyName,
      gender,
      birthDate,
      measurements: {
        height: parseFloat(measurements.height),
        weight: parseFloat(measurements.weight),
        headSize: parseFloat(measurements.headSize),
      },
      // Add any other relevant data
    };

    // Save to your backend/storage
    console.log('Complete Baby Data:', babyData);
    navigation.replace('MainApp');
  };

  const MeasurementInput = ({ label, value, unit, onChange, placeholder }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.measurementInput}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            // Only allow numbers and one decimal point
            if (/^\d*\.?\d*$/.test(text)) {
              onChange(text);
            }
          }}
          placeholder={placeholder}
          keyboardType="decimal-pad" // This will show numeric keypad with decimal
          placeholderTextColor="#999"
          returnKeyType="done"
          maxLength={5} // Limit length to prevent very long numbers
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );

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
          <View style={styles.content}>
            {/* Progress Bar */}
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
              onChange={(text) => setMeasurements({ ...measurements, height: text })}
              placeholder="0.0"
            />

            <MeasurementInput
              label="Weight"
              value={measurements.weight}
              unit="kg"
              onChange={(text) => setMeasurements({ ...measurements, weight: text })}
              placeholder="0.0"
            />

            <MeasurementInput
              label="Head Size"
              value={measurements.headSize}
              unit="cm"
              onChange={(text) => setMeasurements({ ...measurements, headSize: text })}
              placeholder="0.0"
            />

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
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
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  measurementInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 16,
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
    marginTop: 'auto',
    marginBottom: 24,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BabyMeasurementsScreen; 