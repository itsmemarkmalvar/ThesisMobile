import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  BabyNameGenderScreen,
  BabyBirthScreen,
  BabyMeasurementsScreen
} from '../screens/onboarding';

const Stack = createStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="BabyNameGender" component={BabyNameGenderScreen} />
      <Stack.Screen name="BabyBirth" component={BabyBirthScreen} />
      <Stack.Screen name="BabyMeasurements" component={BabyMeasurementsScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator; 