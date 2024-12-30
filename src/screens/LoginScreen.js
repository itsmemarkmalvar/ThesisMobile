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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import FacebookAuthService, { useFacebookAuth } from '../services/FacebookAuthService';
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
  const [request, response, promptAsync] = useFacebookAuth();
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
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
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
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Login Failed', 
          'Please verify your email and password are correct.'
        );
      } else if (error.response?.status === 422) {
        Alert.alert('Error', 'Please check your email and password format.');
      } else {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the server. Please check your internet connection.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      // Clear any existing data before login
      await clearBabyData();
      await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding', 'cachedBabyData']);
      
      const result = await FacebookAuthService.login(promptAsync);
      if (result.success) {
        // Check if user has baby data
        try {
          const babyResponse = await ApiService.get('/baby');
          const hasExistingBaby = babyResponse.data?.data;
          
          if (hasExistingBaby) {
            // Existing user - go straight to MainApp
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
      console.error('Facebook login error:', error);
      Alert.alert('Error', 'Facebook login failed. Please try again.');
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
        <KeyboardAvoidingView 
          style={loginStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={loginStyles.contentContainer}>
            <ScrollView
              contentContainerStyle={loginStyles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={loginStyles.mainContainer}>
                {/* Logo Section */}
                <View style={loginStyles.logoSection}>
                  <View style={loginStyles.iconContainer}>
                    <View style={loginStyles.iconBackground}>
                      <FontAwesome5 name="baby-carriage" size={40} color="#4A90E2" />
                      <MaterialIcons 
                        name="medical-services" 
                        size={20} 
                        color="#4A90E2" 
                        style={loginStyles.medicalIcon} 
                      />
                    </View>
                  </View>
                  <Text style={loginStyles.title}>BINIBABY</Text>
                  <Text style={loginStyles.subtitle}>Your Baby Care Companion</Text>
                </View>

                {/* Login Form */}
                <View style={loginStyles.formSection}>
                  {/* Email Input */}
                  <View style={loginStyles.inputContainer}>
                    <View style={[
                      loginStyles.inputWrapper,
                      errors.email && loginStyles.inputError
                    ]}>
                      <MaterialIcons name="email" size={20} color="#666" />
                      <TextInput
                        style={loginStyles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => {
                          setFormData({ ...formData, email: text });
                          if (errors.email) setErrors({ ...errors, email: null });
                        }}
                      />
                    </View>
                    {errors.email && (
                      <Text style={loginStyles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={loginStyles.inputContainer}>
                    <View style={[
                      loginStyles.inputWrapper,
                      errors.password && loginStyles.inputError
                    ]}>
                      <MaterialIcons name="lock-outline" size={20} color="#666" />
                      <TextInput
                        style={loginStyles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        value={formData.password}
                        onChangeText={(text) => {
                          setFormData({ ...formData, password: text });
                          if (errors.password) setErrors({ ...errors, password: null });
                        }}
                      />
                      <TouchableOpacity
                        style={loginStyles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={loginStyles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={loginStyles.loginButtonText}>Log In</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={loginStyles.forgotPasswordButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Social Login Section */}
                <View style={loginStyles.socialSection}>
                  <View style={loginStyles.divider}>
                    <View style={loginStyles.dividerLine} />
                    <Text style={loginStyles.dividerText}>or continue with</Text>
                    <View style={loginStyles.dividerLine} />
                  </View>
                  
                  {/* Facebook Login Button */}
                  <TouchableOpacity
                    style={[loginStyles.socialButton, loginStyles.facebookButton]}
                    onPress={handleFacebookLogin}
                    disabled={loading}
                  >
                    <FontAwesome5 
                      name="facebook" 
                      size={24} 
                      color="#1877F2" 
                      style={loginStyles.socialButtonIcon} 
                    />
                    <Text style={[loginStyles.socialButtonText, loginStyles.facebookButtonText]}>
                      Continue with Facebook
                    </Text>
                    {loading && (
                      <ActivityIndicator 
                        size="small" 
                        color="#1877F2" 
                        style={loginStyles.buttonLoader} 
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          <Animated.View
            style={[
              loginStyles.bottomContainer,
              {
                backgroundColor: keyboardVisible ? '#FFFFFF' : 'transparent',
                opacity: backgroundOpacity,
              },
            ]}
          >
            <View style={loginStyles.signupContainer}>
              <Text style={loginStyles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={loginStyles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

export default LoginScreen; 