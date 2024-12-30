import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const ProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [fieldLoading, setFieldLoading] = useState({});
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const refreshProfile = async () => {
    setLoading(true);
    try {
      await fetchUserData();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'phone_number':
        return /^[0-9]{11}$/.test(value) ? null : 'Please enter a valid 11-digit phone number';
      case 'name':
        return /^[a-zA-Z\s]{2,50}$/.test(value) ? null : 'Name should only contain letters and spaces (2-50 characters)';
      case 'postal_code':
        return /^[0-9]{4}$/.test(value) ? null : 'Please enter a valid 4-digit postal code';
      case 'birthday':
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
          return 'Birthday cannot be in the future';
        }
        return null;
      default:
        return value.trim() ? null : 'This field is required';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEdit = (field, value) => {
    setEditField(field);
    if (field === 'birthday') {
      const dateValue = value ? new Date(value) : new Date();
      setDate(dateValue);
      setEditValue(dateValue.toISOString().split('T')[0]);
      if (Platform.OS === 'android') {
        setShowDatePicker(true);
      }
    } else {
      setEditValue(value);
    }
    setModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      setEditValue(selectedDate.toISOString().split('T')[0]);
      handleUpdate();
    }
    setModalVisible(false);
  };

  const handleUpdate = async () => {
    const validationError = validateField(editField, editValue);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      setFieldLoading(prev => ({ ...prev, [editField]: true }));
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const response = await axios.put(
        `${API_URL}/auth/user/update`,
        { [editField]: editValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log('Update response:', response.data);

      // Check if we have user data in the response
      if (response.data.user) {
        setUserData(response.data.user);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        // If we don't have user data in the response, fetch it
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setFieldLoading(prev => ({ ...prev, [editField]: false }));
      setModalVisible(false);
      setShowDatePicker(false);
    }
  };

  const renderInfoItem = (icon, label, field, value) => (
    <TouchableOpacity 
      style={styles.infoItem}
      onPress={() => handleEdit(field, value || '')}
      disabled={fieldLoading[field]}
    >
      <MaterialIcons name={icon} size={24} color="#666" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>
          {fieldLoading[field] ? 'Updating...' : 
            (field === 'birthday' ? formatDate(value) : (value || 'Not set'))}
        </Text>
      </View>
      {!fieldLoading[field] && <MaterialIcons name="edit" size={20} color="#4A90E2" />}
      {fieldLoading[field] && <ActivityIndicator size="small" color="#4A90E2" />}
    </TouchableOpacity>
  );

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
          {userData && (
            <>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <MaterialIcons name="account-circle" size={80} color="#4A90E2" />
                </View>
                <Text style={styles.name}>{userData.name}</Text>
                <Text style={styles.email}>{userData.email}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                {renderInfoItem("person", "Name", "name", userData.name)}
                {renderInfoItem("cake", "Birthday", "birthday", userData.birthday)}
                {renderInfoItem("wc", "Gender", "gender", userData.gender)}
                {renderInfoItem("public", "Nationality", "nationality", userData.nationality)}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Contact Details</Text>
                {renderInfoItem("phone", "Phone", "phone_number", userData.phone_number)}
                {renderInfoItem("email", "Email", "email", userData.email)}
                {renderInfoItem("home", "Street Address", "street_address", userData.street_address)}
                {renderInfoItem("location-city", "City", "city", userData.city)}
                {renderInfoItem("map", "Province", "province", userData.province)}
                {renderInfoItem("local-post-office", "Postal Code", "postal_code", userData.postal_code)}
              </View>
            </>
          )}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setShowDatePicker(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editField === 'birthday' ? 'Select Birthday' : 
                  `Edit ${editField?.replace('_', ' ').charAt(0).toUpperCase() + editField?.slice(1)}`}
              </Text>
              
              {editField === 'birthday' && (
                <>
                  {(Platform.OS === 'ios' || showDatePicker) && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        style={styles.datePicker}
                        maximumDate={new Date()} // Prevent future dates
                      />
                      {Platform.OS === 'ios' && (
                        <Text style={styles.selectedDate}>
                          Selected: {formatDate(editValue)}
                        </Text>
                      )}
                    </View>
                  )}
                  {Platform.OS === 'android' && !showDatePicker && (
                    <Text style={styles.selectedDate}>
                      Selected: {formatDate(editValue)}
                    </Text>
                  )}
                </>
              )}

              {editField === 'gender' ? (
                <Picker
                  selectedValue={editValue}
                  onValueChange={(itemValue) => setEditValue(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                </Picker>
              ) : (
                <TextInput
                  style={styles.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={`Enter ${editField?.replace('_', ' ')}`}
                  keyboardType={
                    editField === 'phone_number' || editField === 'postal_code' 
                      ? 'numeric' 
                      : 'default'
                  }
                  maxLength={
                    editField === 'phone_number' 
                      ? 11 
                      : editField === 'postal_code'
                        ? 4
                        : undefined
                  }
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    margin: 15,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  picker: {
    width: '100%',
    marginBottom: 20,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  datePicker: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
    backgroundColor: 'white',
  },
  selectedDate: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ProfileScreen; 