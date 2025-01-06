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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prepare app (load fonts, etc)
    const prepare = async () => {
      try {
        // Add any initialization logic
        await new Promise(resolve => setTimeout(resolve, 2000)); // Minimum splash time
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  // Show splash screen while app is preparing
  if (!isReady) {
    return <SplashScreen />;
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
  );
}
