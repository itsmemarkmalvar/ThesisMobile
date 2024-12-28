import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { signUpStyles } from '../styles/SignUpStyles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { APP_CONFIG } from '../config';


const SignUpScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Test API connection when component mounts
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing API connection...');
        console.log('API URL:', API_URL);
        console.log('Running on:', Platform.OS);
        console.log('Is real device:', APP_CONFIG.isRealDevice);
        
        const response = await axios.get(`${API_URL}/test`, {
          timeout: 5000, // 5 second timeout
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        console.log('API Test Response:', response.data);
      } catch (error) {
        console.error('API Test Error Details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        // Show user-friendly error message
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    };
    testConnection();
  }, []);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  // Error state
  const [errors, setErrors] = useState({});

  const handleError = (error) => {
    console.error('Registration error:', error);
    
    if (error.response?.data?.errors) {
      // Handle validation errors from the backend
      const serverErrors = error.response.data.errors;
      setErrors(serverErrors);
      
      // Show the first error message
      const firstError = Object.values(serverErrors)[0];
      Alert.alert('Registration Failed', firstError[0]);
    } else if (error.response?.data?.message) {
      // Handle specific error message from the backend
      Alert.alert('Registration Failed', error.response.data.message);
    } else {
      // Handle general errors
      Alert.alert(
        'Registration Failed',
        'Something went wrong. Please try again later.'
      );
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate password confirmation
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    // Clear any previous errors
    setErrors({});

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      console.log('Sending registration request to:', `${API_URL}/auth/register`);
      console.log('Form data:', formData);
      
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('Registration response:', response.data);

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
        // Navigate to Onboarding instead of MainApp for new users
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      } else {
        Alert.alert('Error', 'Registration successful but no token received');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={signUpStyles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={signUpStyles.safeArea}>
          <ScrollView 
            style={signUpStyles.content}
            contentContainerStyle={signUpStyles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={signUpStyles.header}>
              <TouchableOpacity 
                style={signUpStyles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="arrow-back-ios" size={24} color="#4A90E2" />
              </TouchableOpacity>
              <Text style={signUpStyles.headerTitle}>Create Account</Text>
            </View>

            {/* Form */}
            <View style={signUpStyles.formContainer}>
              {/* Full Name Input */}
              <View style={signUpStyles.inputContainer}>
                <Text style={signUpStyles.label}>Full Name</Text>
                <View style={signUpStyles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={20} color="#666" />
                  <TextInput
                    style={signUpStyles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
                {errors.name && <Text style={signUpStyles.errorText}>{errors.name}</Text>}
              </View>

              {/* Email Input */}
              <View style={signUpStyles.inputContainer}>
                <Text style={signUpStyles.label}>Email Address</Text>
                <View style={signUpStyles.inputWrapper}>
                  <MaterialIcons name="email" size={20} color="#666" />
                  <TextInput
                    style={signUpStyles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>
                {errors.email && <Text style={signUpStyles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={signUpStyles.inputContainer}>
                <Text style={signUpStyles.label}>Password</Text>
                <View style={signUpStyles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color="#666" />
                  <TextInput
                    style={signUpStyles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                  <TouchableOpacity
                    style={signUpStyles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={signUpStyles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={signUpStyles.inputContainer}>
                <Text style={signUpStyles.label}>Confirm Password</Text>
                <View style={signUpStyles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color="#666" />
                  <TextInput
                    style={signUpStyles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={formData.password_confirmation}
                    onChangeText={(text) => setFormData({ ...formData, password_confirmation: text })}
                  />
                </View>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={signUpStyles.bottomSection}>
              {/* Terms and Conditions */}
              <TouchableOpacity
                style={signUpStyles.termsContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <MaterialIcons
                  name={acceptedTerms ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color="#4A90E2"
                  style={signUpStyles.checkbox}
                />
                <Text style={signUpStyles.termsText}>
                  I agree to the{' '}
                  <Text style={signUpStyles.termsLink}>Terms and Conditions</Text>
                  {' '}and{' '}
                  <Text style={signUpStyles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[
                  signUpStyles.signUpButton,
                  (!acceptedTerms || loading) && { opacity: 0.7 }
                ]}
                disabled={!acceptedTerms || loading}
                onPress={handleSignUp}
              >
                <Text style={signUpStyles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={signUpStyles.divider}>
                <View style={signUpStyles.dividerLine} />
                <Text style={signUpStyles.dividerText}>or sign up with</Text>
                <View style={signUpStyles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={signUpStyles.socialButtonsContainer}>
                <TouchableOpacity style={signUpStyles.socialButton}>
                  <FontAwesome5 name="google" size={20} color="#DB4437" style={signUpStyles.socialButtonIcon} />
                  <Text style={signUpStyles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={signUpStyles.socialButton}>
                  <FontAwesome5 name="facebook" size={20} color="#1877F2" style={signUpStyles.socialButtonIcon} />
                  <Text style={signUpStyles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default SignUpScreen; 