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

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',  // For Android Emulator
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
});

const SignUpScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Test API connection when component mounts
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing API connection...');
        const response = await axios.get(`${API_URL}/test`);
        console.log('API Test Response:', response.data);
      } catch (error) {
        console.error('API Test Error:', error.response?.data || error.message);
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

  const handleSignUp = async () => {
    // Clear any previous errors
    setErrors({});

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setErrors({ ...errors, password: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      console.log('Sending request to:', `${API_URL}/auth/register`);
      console.log('Request data:', formData);
      
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('Response:', response.data);
      
      if (response.data.token) {
        try {
          await AsyncStorage.setItem('userToken', response.data.token);
          console.log('Token saved after registration:', response.data.token.substring(0, 10) + '...');
          
          // Navigate to Onboarding
          navigation.replace('Onboarding');
        } catch (error) {
          console.error('Error saving token:', error);
        }
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        setErrors(error.response.data.errors);
        
        // Show the first error message in an alert
        const firstError = Object.values(error.response.data.errors)[0][0];
        Alert.alert(
          'Registration Failed',
          firstError,
          [{ text: 'OK' }]
        );
      } else {
        // Handle other types of errors
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Something went wrong with registration. Please try again.'
        );
      }

      if (error.response?.data?.errors?.email?.[0]?.includes('already been taken')) {
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Would you like to log in instead?',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.goBack()
            },
            {
              text: 'Try Again',
              style: 'cancel'
            }
          ]
        );
        return;
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