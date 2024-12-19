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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/LoginStyles';
import axios from 'axios';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',  // For Android Emulator
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
});

const LoginScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Basic validation
      if (!formData.email || !formData.password) {
        setErrors({
          message: 'Please enter both email and password'
        });
        return;
      }

      console.log('Attempting login with:', formData);
      
      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log('Login response:', response.data);

      if (response.data.token) {
        // TODO: Store the token securely
        navigation.replace('MainApp');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        Alert.alert(
          'Login Failed',
          error.response.data.message || 'Invalid credentials'
        );
      } else {
        Alert.alert(
          'Error',
          'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
      style={loginStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View 
        style={[
          loginStyles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo and Icon */}
        <View style={loginStyles.logoContainer}>
          <View style={loginStyles.iconContainer}>
            <View style={loginStyles.iconBackground}>
              <FontAwesome5 name="baby-carriage" size={60} color="#4A90E2" />
              <MaterialIcons 
                name="medical-services" 
                size={30} 
                color="#4A90E2" 
                style={loginStyles.medicalIcon} 
              />
            </View>
          </View>
          <Text style={loginStyles.title}>BINIBABY</Text>
          <Text style={loginStyles.subtitle}>Your Baby Care Companion</Text>
        </View>

        {/* Login Form */}
        <View style={loginStyles.formContainer}>
          {/* Email Input */}
          <View style={loginStyles.inputContainer}>
            <View style={loginStyles.inputWrapper}>
              <MaterialIcons name="email" size={20} color="#666" />
              <TextInput
                style={loginStyles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
            </View>
            {errors.email && <Text style={loginStyles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={loginStyles.inputContainer}>
            <View style={loginStyles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color="#666" />
              <TextInput
                style={loginStyles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
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
            {errors.password && <Text style={loginStyles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
            activeOpacity={0.8}
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
            activeOpacity={0.6}
            onPress={() => Alert.alert('Coming Soon', 'Password reset feature coming soon!')}
          >
            <Text style={loginStyles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login Options */}
        <View style={loginStyles.socialContainer}>
          <View style={loginStyles.divider}>
            <View style={loginStyles.dividerLine} />
            <Text style={loginStyles.dividerText}>or continue with</Text>
            <View style={loginStyles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={loginStyles.facebookButton}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Coming Soon', 'Facebook login will be available soon!')}
          >
            <FontAwesome5 name="facebook" size={22} color="#1877F2" style={loginStyles.buttonIcon} />
            <Text style={loginStyles.buttonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={loginStyles.signupContainer}>
          <Text style={loginStyles.signupText}>Don't have an account? </Text>
          <TouchableOpacity 
            activeOpacity={0.6}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={loginStyles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

export default LoginScreen; 