import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState('Auth');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Initial app token check:', !!token);
        if (token) {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.error('Error checking token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
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