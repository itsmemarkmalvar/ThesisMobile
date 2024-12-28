import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import SplashScreen from '../screens/SplashScreen';
import axios from 'axios';
import { API_URL } from '../config';
import ImmunizationScreen from '../screens/ImmunizationScreen';
import EditBabyScreen from '../screens/EditBabyScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Splash');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkInitialState = async () => {
      try {
        const [token, onboardingStatus] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('hasCompletedOnboarding')
        ]);

        console.log('Checking initial state - Token:', token ? 'exists' : 'none');
        setHasCompletedOnboarding(onboardingStatus === 'true');

        if (token) {
          try {
            console.log('Verifying token...');
            const response = await axios.get(`${API_URL}/auth/user`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              }
            });
            
            if (response.data && response.data.user) {
              console.log('Token verified successfully');
              setInitialRoute('MainApp');
            } else {
              console.log('Token verification failed: Invalid response');
              await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding']);
              setInitialRoute('Auth');
            }
          } catch (error) {
            console.error('Token verification error:', error.response?.data || error.message);
            // Clear all auth-related data
            await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding']);
            setInitialRoute('Auth');
          }
        } else {
          console.log('No token found, redirecting to Auth');
          setInitialRoute('Auth');
        }
      } catch (error) {
        console.error('Initial state check error:', error);
        await AsyncStorage.multiRemove(['userToken', 'hasCompletedOnboarding']);
        setInitialRoute('Auth');
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    checkInitialState();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="MainApp" 
        component={MainNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="Immunization" 
        component={ImmunizationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditBaby" component={EditBabyScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 