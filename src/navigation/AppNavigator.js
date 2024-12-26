import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import axios from 'axios';
import { API_URL } from '../config';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null); // Start with null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // First clear any existing tokens to force login
        await AsyncStorage.removeItem('userToken');
        setInitialRoute('Auth'); // Always set to Auth initially
        
        /* Commenting out token check to force login flow
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          try {
            const response = await axios.get(`${API_URL}/baby`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (response.data.data) {
              setInitialRoute('MainApp');
            }
          } catch (error) {
            console.error('Error checking baby data:', error);
            await AsyncStorage.removeItem('userToken');
          }
        }
        */
      } catch (error) {
        console.error('Error checking auth state:', error);
        setInitialRoute('Auth'); // Fallback to Auth on error
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Show nothing while determining the initial route
  if (isLoading || !initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="MainApp" component={MainNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 