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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-facebook';
import * as WebBrowser from 'expo-web-browser';

const { height } = Dimensions.get('window');

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',  // For Android Emulator
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
});

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "18949890492-1ki0nssdie3bb1p1erpk93254fvdukcd.apps.googleusercontent.com",
    expoClientId: "18949890492-1ki0nssdie3bb1p1erpk93254fvdukcd.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Google Auth Response:', response);
      const { authentication } = response;
      console.log('Authentication:', authentication);
      handleGoogleLogin(authentication.accessToken);
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
    }
  }, [response]);

  const handleFacebookLoginPress = async () => {
    try {
      await Facebook.initializeAsync({
        appId: 'your-facebook-app-id',
      });
      const { type, token } = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });
      if (type === 'success') {
        handleFacebookLogin(token);
      }
    } catch (error) {
      Alert.alert('Error', 'Facebook login failed');
    }
  };

  // Add the validation and handleLogin functions from EmailLoginScreen
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
      setErrors({});
      
      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.data.token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        const firstError = Object.values(error.response.data.errors)[0][0];
        Alert.alert('Login Failed', firstError);
      } else if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (token) => {
    try {
      console.log('Starting Google login with token:', token);
      console.log('API URL:', `${API_URL}/auth/google`);
      
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: token
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log('Google login response:', response.data);

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        console.log('Successfully stored auth data');
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error) {
      console.error('Google login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      
      Alert.alert(
        'Google Login Error',
        error.response?.data?.message || 'Failed to login with Google. Please try again.'
      );
    }
  };

  const handleFacebookLogin = async (token) => {
    try {
      const response = await axios.post(`${API_URL}/auth/facebook`, {
        token: token
      });

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Facebook login failed');
    }
  };

  // Add a test function
  const testGoogleSignIn = async () => {
    try {
      console.log('Starting Google Sign-in test...');
      console.log('Request object:', request);
      const result = await promptAsync();
      console.log('Prompt result:', result);
    } catch (error) {
      console.error('Google Sign-in test error:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#FFE5EC', '#FFF2E3', '#E8F7E8']}
      style={loginStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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

          {/* Social Login */}
          <View style={loginStyles.socialSection}>
            <View style={loginStyles.divider}>
              <View style={loginStyles.dividerLine} />
              <Text style={loginStyles.dividerText}>or continue with</Text>
              <View style={loginStyles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={loginStyles.socialButton}
              onPress={async () => {
                console.log('Google button pressed');
                await testGoogleSignIn();
              }}
            >
              <FontAwesome5 name="google" size={20} color="#DB4437" />
              <Text style={loginStyles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={loginStyles.socialButton}
              onPress={handleFacebookLoginPress}
            >
              <FontAwesome5 name="facebook" size={20} color="#1877F2" />
              <Text style={loginStyles.buttonText}>Continue with Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={loginStyles.signupContainer}>
          <Text style={loginStyles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={loginStyles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default LoginScreen; 