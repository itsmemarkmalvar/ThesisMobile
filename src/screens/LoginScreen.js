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
import FacebookAuthService from '../services/FacebookAuthService';
import { API_URL, APP_CONFIG } from '../config';

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
      
      // Trim whitespace from email and password
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim()
      };
      
      console.log('Login attempt details:', {
        email: loginData.email,
        emailLength: loginData.email.length,
        passwordLength: loginData.password.length,
        url: `${API_URL}/auth/login`,
        passwordStart: loginData.password[0],
        passwordEnd: loginData.password[loginData.password.length - 1]
      });

      // First, try to verify if the server is reachable
      try {
        const testResponse = await axios.get(`${API_URL}/test`);
        console.log('Server test response:', testResponse.data);
      } catch (testError) {
        console.error('Server test failed:', testError.message);
      }
      
      // Add request data logging
      console.log('Sending login request with data:', {
        email: loginData.email,
        passwordLength: loginData.password.length
      });
      
      // Proceed with login
      const response = await axios.post(`${API_URL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all responses to handle them manually
        }
      });

      console.log('Full response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      if (response.status === 200 && response.data.token) {
        console.log('Login successful, storing token');
        await AsyncStorage.setItem('userToken', response.data.token);
        
        // Clear any stored onboarding status if needed
        const onboardingStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
        if (!onboardingStatus) {
          await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
        }
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else if (response.status === 401) {
        // Try to get more details about the error
        console.log('Authentication failed:', response.data);
        Alert.alert(
          'Login Failed',
          'The email or password you entered is incorrect. Please double-check your credentials.'
        );
      } else {
        console.log('Unexpected response:', response.data);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        data: error.config?.data // Log what was actually sent
      });
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Login Failed', 
          'Please verify your email and password are correct.'
        );
      } else if (error.response?.status === 404) {
        Alert.alert('Error', 'Unable to reach the login service. Please try again later.');
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
      const result = await FacebookAuthService.login();
      if (result.success) {
        navigation.replace('MainApp');
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