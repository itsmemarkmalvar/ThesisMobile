import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const EmailVerificationScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const email = route.params?.email || '';

  // Check verification status periodically
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/check-verification/${email}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data.verified) {
          await proceedToOnboarding();
        }
      } catch (error) {
        console.log('Verification check:', error.response?.data);
      }
    };

    const interval = setInterval(checkVerification, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [email]);

  const proceedToOnboarding = async () => {
    try {
      // Get the token after verification
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password: route.params?.password // We need to pass password from SignUp
      });

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      }
    } catch (error) {
      console.error('Error proceeding to onboarding:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try logging in again.');
      navigation.navigate('Login');
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/auth/resend-verification-email`,
        { email: email },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );
      setMessage('Verification email has been resent. Please check your inbox.');
      Alert.alert('Success', 'Verification email has been resent. Please check your inbox.');
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
      Alert.alert('Error', 'Failed to resend verification email.');
      console.error('Resend verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.container}>
          <MaterialIcons name="mark-email-read" size={100} color="#4A90E2" />
          
          <Text style={styles.title}>Verify Your Email</Text>
          
          <Text style={styles.description}>
            We've sent a verification email to:
          </Text>
          
          <Text style={styles.email}>{email}</Text>
          
          <Text style={styles.instructions}>
            Please check your email and click the verification link to continue.
          </Text>

          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resendButtonText}>Resend Verification Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 14,
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 20,
  },
  resendButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 10,
  },
  loginButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default EmailVerificationScreen; 