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
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      // Store token and navigate without showing any alert
      if (response.data.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        navigation.replace('MainApp');
      } else {
        // Only show alert for errors
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Server endpoint not found.');
      } else if (error.response?.status === 401) {
        Alert.alert('Error', 'Invalid email or password');
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
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