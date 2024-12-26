import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import axios from 'axios';
import { API_URL } from '../config';
import ImmunizationScreen from '../screens/ImmunizationScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null); // Start with null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Initial token check:', token); // Debug log

        if (token) {
          // Verify token validity with backend
          try {
            const response = await axios.get(`${API_URL}/verify-token`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            if (response.data.success) {
              setInitialRoute('MainApp');
            } else {
              await AsyncStorage.removeItem('userToken');
              setInitialRoute('Auth');
            }
          } catch (error) {
            console.error('Token verification error:', error);
            await AsyncStorage.removeItem('userToken');
            setInitialRoute('Auth');
          }
        } else {
          setInitialRoute('Auth');
        }
      } catch (error) {
        console.error('Auth state check error:', error);
        setInitialRoute('Auth');
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
      <Stack.Screen 
        name="Immunization" 
        component={ImmunizationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator; 