import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';

const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIcon}>
      <MaterialIcons name={icon} size={24} color="#4A90E2" />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />}
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = React.useState(false);
  const [currentTimeZone, setCurrentTimeZone] = useState('auto');
  const [userData, setUserData] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadTimeZone();
    loadUserData();
  }, []);

  const loadTimeZone = async () => {
    try {
      const savedTimeZone = await AsyncStorage.getItem('userTimeZone');
      setCurrentTimeZone(savedTimeZone || 'auto');
    } catch (error) {
      console.error('Error loading timezone:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await axios.get(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        setUserData(response.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Add focus listener to reload timezone when returning from TimeZoneScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTimeZone();
    });

    return unsubscribe;
  }, [navigation]);

  // Add focus listener to reload user data when returning from ChangePassword screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const getDisplayTimeZone = () => {
    if (currentTimeZone === 'auto') {
      return `Auto (${Localization.timezone})`;
    }
    return currentTimeZone;
  };

  const getLastPasswordChangeText = () => {
    if (!userData?.updated_at) return 'Never changed';

    const lastChange = new Date(userData.updated_at);
    const now = new Date();
    const diffInMs = now - lastChange;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInMonths / 12);

    if (diffInDays < 1) return 'Changed today';
    if (diffInDays === 1) return 'Changed yesterday';
    if (diffInDays < 30) return `Changed ${diffInDays} days ago`;
    if (diffInMonths === 1) return 'Changed 1 month ago';
    if (diffInMonths < 12) return `Changed ${diffInMonths} months ago`;
    if (diffInYears === 1) return 'Changed 1 year ago';
    return `Changed ${diffInYears} years ago`;
  };

  const handleLogout = async () => {
    try {
      // Show loading indicator or disable the button
      setLoading(true);

      // Call the logout endpoint to invalidate the token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with local logout even if API call fails
        }
      }

      // Clear all local storage data
      await AsyncStorage.multiRemove([
        'userToken',
        'hasCompletedOnboarding',
        'userData'
      ]);

      // Reset navigation to Auth screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // First confirmation
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => promptPasswordConfirmation(),
        },
      ],
      { cancelable: true }
    );
  };

  const promptPasswordConfirmation = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Confirm Password',
        'Please enter your password to confirm account deletion',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: (password) => performAccountDeletion(password),
          },
        ],
        'secure-text'
      );
    } else {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordConfirm = () => {
    setShowPasswordModal(false);
    performAccountDeletion(password);
    setPassword('');
  };

  const performAccountDeletion = async (password) => {
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    try {
      setDeleteLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      console.log('Attempting to delete account with token:', token);
      
      const response = await axios.post(
        `${API_URL}/auth/delete-account`,
        { password },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
        }
      );

      console.log('Delete account response:', response.data);

      // Clear all local storage data
      await AsyncStorage.multiRemove([
        'userToken',
        'hasCompletedOnboarding',
        'userData',
        'userTimeZone'
      ]);

      // Show success message
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Auth screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Delete account error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error.response?.status === 422) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(
        'Error',
        errorMessage
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <SettingItem
              icon="access-time"
              title="Time Zone"
              subtitle={getDisplayTimeZone()}
              onPress={() => navigation.navigate('TimeZone')}
            />
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <SettingItem
              icon="lock-outline"
              title="Change Password"
              subtitle={getLastPasswordChangeText()}
              onPress={() => navigation.navigate('ChangePassword')}
            />
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <SettingItem
              icon="info-outline"
              title="About"
              subtitle="Version 1.1.8"
              onPress={() => navigation.navigate('About')}
            />
            <SettingItem
              icon="policy"
              title="Privacy Policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <SettingItem
              icon="description"
              title="Terms of Service"
              onPress={() => navigation.navigate('TermsOfService')}
            />
          </View>

          {/* Account Actions */}
          <View style={styles.accountActions}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loading}
            >
              <MaterialIcons name="logout" size={20} color="#FF4B4B" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
            >
              <MaterialIcons name="delete-forever" size={20} color="#FF4B4B" />
              <Text style={styles.deleteAccountText}>
                {deleteLoading ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowPasswordModal(false);
            setPassword('');
            setShowPassword(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirm Password</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your password to confirm account deletion
                </Text>
                
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordVisibilityButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPasswordModal(false);
                      setPassword('');
                      setShowPassword(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handlePasswordConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradient: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  accountActions: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
    gap: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF4B4B',
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
  },
  deleteAccountButton: {
    padding: 16,
    backgroundColor: '#FFE8E8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  passwordVisibilityButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#FF4B4B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen; 