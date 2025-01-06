import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignUpScreen, ForgotPasswordScreen } from '../screens';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { 
  BabyNameGenderScreen,
  BabyBirthScreen,
  BabyMeasurementsScreen
} from '../screens/onboarding';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="Onboarding" component={BabyNameGenderScreen} />
      <Stack.Screen name="BabyBirth" component={BabyBirthScreen} />
      <Stack.Screen name="BabyMeasurements" component={BabyMeasurementsScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 