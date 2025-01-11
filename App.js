import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { syncManager } from './src/utils/SyncManager';
import * as Linking from 'expo-linking';
import { DateTimeService } from './src/services/DateTimeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimezoneProvider } from './src/context/TimezoneContext';
import LoadingSpinner from './src/components/LoadingSpinner';

// Initialize sync manager
syncManager;

// Define theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF9A9E',
    accent: '#FF9A9E',
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isTimezoneInitialized, setIsTimezoneInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize timezone first
      await DateTimeService.initialize();
      setIsTimezoneInitialized(true);

      // Check for stored token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const linking = {
    prefixes: ['binibaby://', 'exp://'],
    config: {
      screens: {
        Auth: {
          screens: {
            ResetPassword: {
              path: 'reset-password',
              parse: {
                token: token => {
                  console.log('Parsing token:', token);
                  return token;
                },
                email: email => {
                  console.log('Parsing email:', email);
                  return email;
                }
              }
            }
          }
        }
      }
    },
    async getInitialURL() {
      // First, you would want to check if app was opened from a deep link
      const url = await Linking.getInitialURL();
      console.log('Initial URL:', url);
      if (url != null) {
        return url;
      }
      return null;
    },
    subscribe(listener) {
      console.log('Setting up deep link listener');
      const onReceiveURL = ({ url }) => {
        console.log('Received URL:', url);
        listener(url);
      };

      // Listen to incoming links from deep linking
      const eventListenerSubscription = Linking.addEventListener('url', onReceiveURL);

      return () => {
        console.log('Cleaning up deep link listener');
        eventListenerSubscription.remove();
      };
    },
  };

  // After splash screen, show the main app
  return (
    <TimezoneProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer linking={linking}>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TimezoneProvider>
  );
}
