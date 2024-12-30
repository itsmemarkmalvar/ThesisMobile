import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BabyProvider } from '../context/BabyContext';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <BabyProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="MainApp" component={MainNavigator} />
      </Stack.Navigator>
    </BabyProvider>
  );
};

export default AppNavigator; 