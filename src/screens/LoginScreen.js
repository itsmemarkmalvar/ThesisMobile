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

const { height } = Dimensions.get('window');

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',  // For Android Emulator
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
});

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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

            <TouchableOpacity style={loginStyles.facebookButton}>
              <FontAwesome5 name="facebook" size={20} color="#1877F2" style={loginStyles.buttonIcon} />
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