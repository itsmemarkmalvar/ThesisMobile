import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import BabyScreen from '../screens/BabyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GrowthTrackingScreen from '../screens/GrowthTrackingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#4A90E2',
      tabBarInactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="home" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Baby" 
      component={BabyScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="child-care" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="person" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="settings" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen name="GrowthTracking" component={GrowthTrackingScreen} />
  </Stack.Navigator>
);

export default MainNavigator; 