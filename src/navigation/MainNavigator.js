import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import BabyScreen from '../screens/BabyScreen';
import EditBabyScreen from '../screens/EditBabyScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GrowthTrackingScreen from '../screens/GrowthTrackingScreen';
import DevelopmentScreen from '../screens/DevelopmentScreen';
import HealthScreen from '../screens/HealthScreen';
import MedicineScreen from '../screens/MedicineScreen';
import FeedingScreen from '../screens/FeedingScreen';
import SleepScreen from '../screens/SleepScreen';
import DiaperScreen from '../screens/DiaperScreen';
import ImmunizationScreen from '../screens/ImmunizationScreen';
import AddFeedingScreen from '../screens/AddFeedingScreen';
import EditFeedingScreen from '../screens/EditFeedingScreen';
import AddSleepScreen from '../screens/AddSleepScreen';
import EditSleepScreen from '../screens/EditSleepScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import MedicineDetailsScreen from '../screens/MedicineDetailsScreen';
import AddMedicineScheduleScreen from '../screens/AddMedicineScheduleScreen';
import EditMedicineScreen from '../screens/EditMedicineScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, focused, color }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <MaterialIcons name={name} size={24} color={focused ? '#FF9A9E' : '#757575'} />
  </View>
);

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false
    }}
  >
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="EditBaby" component={EditBabyScreen} />
    <Stack.Screen name="GrowthTracking" component={GrowthTrackingScreen} />
    <Stack.Screen name="Development" component={DevelopmentScreen} />
    <Stack.Screen name="Health" component={HealthScreen} />
    <Stack.Screen
        name="Medicine"
        component={MedicineScreen}
        options={{
            headerShown: false
        }}
    />
    <Stack.Screen name="Feeding" component={FeedingScreen} />
    <Stack.Screen
        name="Sleep"
        component={SleepScreen}
        options={{
            headerShown: false
        }}
    />
    <Stack.Screen name="Diaper" component={DiaperScreen} />
    <Stack.Screen name="Immunization" component={ImmunizationScreen} />
    <Stack.Screen name="AddFeeding" component={AddFeedingScreen} />
    <Stack.Screen name="EditFeeding" component={EditFeedingScreen} />
    <Stack.Screen
        name="AddSleep"
        component={AddSleepScreen}
        options={{
            title: 'Add Sleep Log',
            headerShown: true
        }}
    />
    <Stack.Screen
        name="EditSleep"
        component={EditSleepScreen}
        options={{
            title: 'Edit Sleep Log',
            headerShown: true
        }}
    />
    <Stack.Screen
        name="AddMedicine"
        component={AddMedicineScreen}
        options={{
            headerShown: false
        }}
    />
    <Stack.Screen
        name="MedicineDetails"
        component={MedicineDetailsScreen}
        options={{
            headerShown: false
        }}
    />
    <Stack.Screen
        name="EditMedicine"
        component={EditMedicineScreen}
        options={{
            headerShown: false
        }}
    />
    <Stack.Screen
        name="AddMedicineSchedule"
        component={AddMedicineScheduleScreen}
        options={{
            headerShown: false
        }}
    />
  </Stack.Navigator>
);

const BabyStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false
    }}
  >
    <Stack.Screen name="BabyMain" component={BabyScreen} />
    <Stack.Screen name="EditBaby" component={EditBabyScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Baby') {
            iconName = 'child-care';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <TabBarIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarStyle: {
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarActiveTintColor: '#FF9A9E',
        tabBarInactiveTintColor: '#757575',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          title: 'Home'
        }}
      />
      <Tab.Screen 
        name="Baby" 
        component={BabyStack}
        options={{
          title: 'Baby'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings'
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconContainerFocused: {
    backgroundColor: '#FFF5F5',
  },
});

export default MainNavigator; 