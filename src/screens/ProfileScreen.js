import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal as RNModal,
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

const CustomModal = ({ visible, onClose, title, children }) => (
  <RNModal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        {children}
      </View>
    </View>
  </RNModal>
);

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
      case 'gender':
        if (!value || !['male', 'female'].includes(value)) {
          return 'Please select a valid gender';
        }
        return null;
      default:
        return value.trim() ? null : 'This field is required';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEdit = (field, value) => {
    setEditField(field);
    if (field === 'birthday') {
      let dateValue;
      if (value) {
        dateValue = new Date(value);
      } else {
        dateValue = new Date();
      }
      
      if (isNaN(dateValue.getTime())) {
        dateValue = new Date();
      }
      
      console.log('Initial date value:', dateValue.toISOString());
      setDate(dateValue);
      if (Platform.OS === 'android') {
        setShowDatePicker(true);
      }
    } else if (field === 'gender') {
      setEditValue(value === null || value === undefined ? 'male' : value);
    } else {
      setEditValue(value);
    }
    setModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (!selectedDate) return;
    
    console.log('Selected date:', selectedDate.toISOString());
    setDate(selectedDate);
    
    if (Platform.OS === 'android') {
      setModalVisible(false);
      setTimeout(() => {
        console.log('Saving date:', selectedDate.toISOString());
        handleDateSave(selectedDate);
      }, 100);
    }
  };

  const handleDateSave = async (selectedDate) => {
    try {
      setFieldLoading(prev => ({ ...prev, [editField]: true }));
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const dateToUse = selectedDate || date;
      console.log('Date to use for saving:', dateToUse.toISOString());

      const year = dateToUse.getFullYear();
      const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
      const day = String(dateToUse.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      console.log('Formatted date to send:', formattedDate);

      const response = await axios.put(
        `${API_URL}/auth/user/update`,
        { birthday: formattedDate },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      console.log('Birthday update response:', response.data);

      if (response.data.user) {
        setUserData(response.data.user);
        Alert.alert('Success', 'Birthday updated successfully');
      } else {
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating birthday:', error.response?.data || error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update birthday. Please try again.'
      );
    } finally {
      setFieldLoading(prev => ({ ...prev, [editField]: false }));
      setModalVisible(false);
    }
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

      console.log('Sending update request:', { [editField]: editValue });

      const response = await axios.put(
        `${API_URL}/auth/user/update`,
        { [editField]: editValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Raw response:', response.data);

      if (response.data.user) {
        setUserData(response.data.user);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setFieldLoading(prev => ({ ...prev, [editField]: false }));
      setModalVisible(false);
      setShowDatePicker(false);
    }
  };

  const handleGenderUpdate = (value) => {
    console.log('Selected gender:', value);
    setEditValue(value);
    if (Platform.OS === 'android') {
      setModalVisible(false);
      updateGender(value);
    }
  };

  const updateGender = async (genderValue) => {
    try {
      setFieldLoading(prev => ({ ...prev, gender: true }));
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      console.log('Sending gender update request:', { gender: genderValue });

      const response = await axios.put(
        `${API_URL}/auth/user/update`,
        { gender: genderValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Raw response:', response.data);

      if (response.data.user) {
        setUserData(response.data.user);
        Alert.alert('Success', 'Gender updated successfully');
      } else {
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating gender:', error.response?.data || error);
      Alert.alert('Error', 'Failed to update gender');
    } finally {
      setFieldLoading(prev => ({ ...prev, gender: false }));
      setModalVisible(false);
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

  const getModalTitle = (field) => {
    switch (field) {
      case 'phone_number':
        return 'Phone Number';
      case 'street_address':
        return 'Street Address';
      case 'postal_code':
        return 'Postal Code';
      case 'name':
        return 'Name';
      case 'nationality':
        return 'Nationality';
      case 'city':
        return 'City';
      case 'province':
        return 'Province';
      default:
        return field ? field.charAt(0).toUpperCase() + field.slice(1) : '';
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

        <CustomModal
          visible={modalVisible && editField !== 'birthday' && editField !== 'gender'}
          onClose={() => setModalVisible(false)}
          title={getModalTitle(editField)}
        >
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
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
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
        </CustomModal>

        <CustomModal
          visible={modalVisible && editField === 'birthday'}
          onClose={() => setModalVisible(false)}
          title="Select Birthday"
        >
          {Platform.OS === 'ios' ? (
            <View style={styles.modalContent}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                style={styles.iosDatePicker}
                maximumDate={new Date()}
                textColor="black"
                themeVariant="light"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleDateSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </CustomModal>

        <CustomModal
          visible={modalVisible && editField === 'gender'}
          onClose={() => setModalVisible(false)}
          title="Edit Gender"
        >
          {Platform.OS === 'ios' ? (
            <View style={styles.modalContent}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editValue}
                  onValueChange={handleGenderUpdate}
                  style={styles.iosPicker}
                  itemStyle={styles.iosPickerItem}
                >
                  <Picker.Item label="Male" value="male" color="#000000" />
                  <Picker.Item label="Female" value="female" color="#000000" />
                </Picker>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={() => updateGender(editValue)}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editValue}
                onValueChange={handleGenderUpdate}
                style={styles.picker}
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>
          )}
        </CustomModal>
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    marginBottom: 20,
    minHeight: Platform.OS === 'ios' ? 44 : 40,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
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
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  picker: {
    width: '100%',
    height: 50,
  },
  iosDatePicker: {
    width: '100%',
    height: 200,
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  iosPickerItem: {
    fontSize: 16,
    color: '#000000',
  },
});

export default ProfileScreen; 