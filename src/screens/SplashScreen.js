import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Initial token check:', token);

      if (!token) {
        // If no token exists, navigate to Auth/Login
        navigation.replace('Auth');
        return;
      }

      // Only verify token if it exists
      try {
        const response = await axios.get(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.data) {
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      } catch (error) {
        console.log('Token verification failed:', error);
        // Clear invalid token
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Auth');
      }
    } catch (error) {
      console.log('Error checking token:', error);
      navigation.replace('Auth');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9A9E" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default SplashScreen; 