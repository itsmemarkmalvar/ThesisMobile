import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BabyNameGenderScreen,
  BabyBirthScreen,
  BabyMeasurementsScreen
} from '../screens/onboarding';

const Stack = createStackNavigator();

const OnboardingNavigator = ({ navigation }) => {
  useEffect(() => {
    const verifyToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Onboarding token check:', !!token);
      if (!token) {
        navigation.replace('Auth');
      }
    };

    verifyToken();
  }, []);

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