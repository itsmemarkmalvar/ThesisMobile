import React, { useState } from 'react';
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

const EditBabyScreen = ({ route, navigation }) => {
  const { babyData } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: babyData.name,
    gender: babyData.gender,
    birth_date: new Date(babyData.birth_date),
    height: babyData.height.toString(),
    weight: babyData.weight.toString(),
    head_size: babyData.head_size.toString(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleUpdate = async () => {
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
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        head_size: parseFloat(formData.head_size),
      };

      const response = await axios.put(`${API_URL}/baby`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.data) {
        Alert.alert('Success', 'Baby information updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MainApp', {
                screen: 'Baby',
                params: { refresh: Date.now() }
              });
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating baby:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update baby information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, birth_date: selectedDate }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('MainApp', {
            screen: 'Baby'
          })}
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
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Baby's name"
          />
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
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color="#4A90E2" />
            <Text style={styles.dateText}>
              {formData.birth_date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(text) => setFormData(prev => ({ ...prev, height: text }))}
            keyboardType="decimal-pad"
            placeholder="Height in centimeters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
            keyboardType="decimal-pad"
            placeholder="Weight in kilograms"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Head Size (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.head_size}
            onChangeText={(text) => setFormData(prev => ({ ...prev, head_size: text }))}
            keyboardType="decimal-pad"
            placeholder="Head circumference in centimeters"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
    padding: 12,
    borderRadius: 8,
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
    borderRadius: 8,
    padding: 12,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditBabyScreen; 