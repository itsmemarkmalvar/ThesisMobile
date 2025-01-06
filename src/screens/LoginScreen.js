import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Keyboard,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { API_URL, APP_CONFIG } from '../config';
import ApiService from '../services/ApiService';
import { useBaby } from '../context/BabyContext';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const backgroundOpacity = new Animated.Value(1);
  const { clearBabyData, updateBabyData } = useBaby();

  // Helper function to cache baby data
  const cacheBabyData = async (data) => {
    try {
      await AsyncStorage.setItem('cachedBabyData', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      updateBabyData(data);
    } catch (e) {
      console.error('Error caching baby data:', e);
    }
  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          try {
            // First verify token validity
            await ApiService.get('/auth/user');
            
            // Then check if user has baby data
            const babyResponse = await ApiService.get('/baby');
            const hasExistingBaby = babyResponse.data?.data;
            
            if (hasExistingBaby) {
              // Existing user with baby data - go straight to MainApp
              await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
              await cacheBabyData(hasExistingBaby);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              });
            } else {
              // Check cached data as fallback
              const cachedData = await AsyncStorage.getItem('cachedBabyData');
              if (cachedData) {
                const { data } = JSON.parse(cachedData);
                if (data) {
                  await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainApp' }],
                  });
                  return;
                }
              }
              // User logged in but no baby data - clear session and start fresh
              await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding', 'cachedBabyData']);
              await clearBabyData();
            }
          } catch (error) {
            console.error('Session validation error:', error);
            // If token is invalid or no baby data, clear everything
            await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding', 'cachedBabyData']);
            await clearBabyData();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkExistingSession();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim()
      };

      // Clear any existing data before login
      await clearBabyData();
      await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding', 'cachedBabyData']);
      
      const response = await ApiService.post('/auth/login', loginData);

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        
        // Check if user has baby data
        try {
          const babyResponse = await ApiService.get('/baby');
          const hasExistingBaby = babyResponse.data?.data;
          
          if (hasExistingBaby) {
            // Existing user - go straight to MainApp
            // Set hasCompletedOnboarding to true since user has baby data
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
            await cacheBabyData(hasExistingBaby);
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp' }],
            });
          } else {
            // New user - go through onboarding
            await AsyncStorage.removeItem('hasCompletedOnboarding');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          }
        } catch (error) {
          console.error('Error checking baby data:', error);
          // If error checking baby data, check cached data
          const cachedData = await AsyncStorage.getItem('cachedBabyData');
          if (cachedData) {
            const { data } = JSON.parse(cachedData);
            if (data) {
              await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              });
              return;
            }
          }
          // No cached data, assume new user
          await AsyncStorage.removeItem('hasCompletedOnboarding');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        }
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      
      // Clear any existing errors first
      setErrors({});
      
      // Handle network errors
      if (error.message === 'NETWORK_ERROR') {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
        return;
      }

      // Handle server responses
      if (error.response) {
        const { status, data } = error.response;

        // Handle unauthorized (wrong credentials)
        if (status === 401) {
          if (data?.errors?.password) {
            setErrors({
              password: Array.isArray(data.errors.password) 
                ? data.errors.password[0] 
                : 'The password you entered is incorrect'
            });
          } else if (data?.errors?.email) {
            setErrors({
              email: Array.isArray(data.errors.email)
                ? data.errors.email[0]
                : 'The email you entered is incorrect'
            });
          } else if (data?.message === 'Invalid credentials') {
            setErrors({
              password: 'The password you entered is incorrect'
            });
          }
          return;
        }

        // Handle validation errors (missing fields, invalid format)
        if (status === 422 && data?.errors) {
          const validationErrors = {};
          Object.keys(data.errors).forEach(field => {
            validationErrors[field] = Array.isArray(data.errors[field])
              ? data.errors[field][0]
              : data.errors[field];
          });
          setErrors(validationErrors);
          return;
        }

        // Handle unverified email
        if (status === 403) {
          setErrors({
            email: 'Please verify your email first'
          });
          return;
        }

        // Handle other server errors
        Alert.alert(
          'Error',
          data?.message || 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={loginStyles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAwareScrollView
          style={loginStyles.contentContainer}
          contentContainerStyle={loginStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={loginStyles.mainContainer}>
            <View style={loginStyles.logoSection}>
              <View style={loginStyles.iconContainer}>
                <Image
                  source={require('../../assets/Logo.png')}
                  style={loginStyles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={loginStyles.title}>Binibaby</Text>
              <Text style={loginStyles.subtitle}>Track your baby's growth and development</Text>
            </View>

            <View style={loginStyles.formSection}>
              <View style={loginStyles.inputContainer}>
                <View style={[loginStyles.inputWrapper, errors.email && loginStyles.inputError]}>
                  <MaterialIcons name="email" size={20} color="#8F9BB3" />
                  <TextInput
                    style={loginStyles.input}
                    placeholder="Email"
                    placeholderTextColor="#8F9BB3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData({ ...formData, email: text });
                      // Clear error when user starts typing
                      if (errors.email) {
                        setErrors({ ...errors, email: null });
                      }
                    }}
                  />
                </View>
                {errors.email && <Text style={loginStyles.errorText}>{errors.email}</Text>}
              </View>

              <View style={loginStyles.inputContainer}>
                <View style={[loginStyles.inputWrapper, errors.password && loginStyles.inputError]}>
                  <MaterialIcons name="lock" size={20} color="#8F9BB3" />
                  <TextInput
                    style={loginStyles.input}
                    placeholder="Password"
                    placeholderTextColor="#8F9BB3"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      // Clear error when user starts typing
                      if (errors.password) {
                        setErrors({ ...errors, password: null });
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={loginStyles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#8F9BB3"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={loginStyles.errorText}>{errors.password}</Text>}
              </View>

              <TouchableOpacity
                style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={loginStyles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={loginStyles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={loginStyles.bottomContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={loginStyles.forgotPasswordText}>
                  Don't have an account? <Text style={{ color: '#4A90E2' }}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </>
  );
};

export default LoginScreen; 