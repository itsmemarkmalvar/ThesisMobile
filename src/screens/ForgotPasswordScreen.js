import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { forgotPasswordStyles } from '../styles/ForgotPasswordStyles';
import axios from 'axios';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://localhost:8000/api',
  default: 'http://10.0.2.2:8000/api'
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email
      });

      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error.response?.data || error.message);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
      style={forgotPasswordStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={forgotPasswordStyles.header}>
        <TouchableOpacity 
          style={forgotPasswordStyles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={forgotPasswordStyles.headerTitle}>Reset Password</Text>
      </View>

      <View style={forgotPasswordStyles.content}>
        <Text style={forgotPasswordStyles.description}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <View style={forgotPasswordStyles.inputContainer}>
          <View style={[
            forgotPasswordStyles.inputWrapper,
            error && forgotPasswordStyles.inputError
          ]}>
            <MaterialIcons name="email" size={20} color="#666" />
            <TextInput
              style={forgotPasswordStyles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
            />
          </View>
          {error && (
            <Text style={forgotPasswordStyles.errorText}>{error}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            forgotPasswordStyles.resetButton,
            loading && forgotPasswordStyles.resetButtonDisabled
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={forgotPasswordStyles.resetButtonText}>
              Send Reset Instructions
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen; 