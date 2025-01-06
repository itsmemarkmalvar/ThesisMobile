import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBaby } from '../context/BabyContext';

const EditBabyScreen = ({ route, navigation }) => {
  const { babyData, updateBabyData } = useBaby();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: babyData.name,
    gender: babyData.gender,
    birth_date: new Date(babyData.birth_date),
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onBackPress = () => {
    navigation.goBack();
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Birth date validation
    if (formData.birth_date > new Date()) {
      newErrors.birth_date = 'Birth date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        navigation.replace('Auth');
        return;
      }

      const updateData = {
        ...formData,
        birth_date: formData.birth_date.toISOString().split('T')[0],
      };

      const MAX_RETRIES = 2;
      let retryCount = 0;
      let lastError = null;

      while (retryCount <= MAX_RETRIES) {
        try {
          const response = await axios.put(`${API_URL}/baby`, updateData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 10000,
          });

          if (response.data && response.data.data) {
            updateBabyData(response.data.data);
            navigation.replace('BabyMain');
            return;
          } else {
            throw new Error(response.data.message || 'Update failed');
          }
        } catch (error) {
          lastError = error;
          if (error.code === 'ERR_NETWORK') {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              continue;
            }
          }
          break;
        }
      }

      console.error('Error updating baby:', lastError?.message);
      
      let errorMessage = 'Failed to update baby information. ';
      if (lastError?.code === 'ERR_NETWORK') {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (lastError?.response?.status === 401) {
        errorMessage += 'Your session has expired. Please login again.';
        navigation.replace('Auth');
      } else if (lastError?.message) {
        errorMessage += lastError.message;
      } else {
        errorMessage += 'Please try again.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, birth_date: selectedDate }));
      setErrors(prev => ({ ...prev, birth_date: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Baby Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, name: text }));
              setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Baby's name"
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'male' && styles.genderButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
            >
              <MaterialIcons 
                name="male" 
                size={24} 
                color={formData.gender === 'male' ? '#FFF' : '#4A90E2'} 
              />
              <Text style={[
                styles.genderText,
                formData.gender === 'male' && styles.genderTextActive
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'female' && styles.genderButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
            >
              <MaterialIcons 
                name="female" 
                size={24} 
                color={formData.gender === 'female' ? '#FFF' : '#4A90E2'} 
              />
              <Text style={[
                styles.genderText,
                formData.gender === 'female' && styles.genderTextActive
              ]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.birth_date && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color="#4A90E2" />
            <Text style={styles.dateText}>
              {formData.birth_date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {errors.birth_date && <Text style={styles.errorText}>{errors.birth_date}</Text>}
          {showDatePicker && (
            <DateTimePicker
              value={formData.birth_date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.updateButton,
          loading && styles.updateButtonDisabled
        ]}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.updateButtonText}>Update Information</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    backgroundColor: '#FFF',
  },
  genderButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4A90E2',
  },
  genderTextActive: {
    color: '#FFF',
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#4A90E2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonDisabled: {
    backgroundColor: '#A8C9F0',
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditBabyScreen; 