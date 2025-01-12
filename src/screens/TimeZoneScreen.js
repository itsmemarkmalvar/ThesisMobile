import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { DateTimeService } from '../services/DateTimeService';

const STORAGE_KEY = 'userTimezone';
const DEFAULT_TIMEZONE = 'Asia/Manila';

const timeZones = [
  { label: 'Auto (Device Settings)', value: 'auto' },
  { label: '(GMT-08:00) Pacific Time', value: 'America/Los_Angeles' },
  { label: '(GMT-05:00) Eastern Time', value: 'America/New_York' },
  { label: '(GMT+00:00) London', value: 'Europe/London' },
  { label: '(GMT+01:00) Paris', value: 'Europe/Paris' },
  { label: '(GMT+08:00) Singapore', value: 'Asia/Singapore' },
  { label: '(GMT+08:00) Manila', value: 'Asia/Manila' },
  { label: '(GMT+09:00) Tokyo', value: 'Asia/Tokyo' },
  { label: '(GMT+10:00) Sydney', value: 'Australia/Sydney' },
];

const TimeZoneScreen = ({ navigation }) => {
  const [selectedTimezone, setSelectedTimezone] = useState('auto');
  const [deviceTimezone, setDeviceTimezone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeTimezone();
  }, []);

  const initializeTimezone = async () => {
    try {
      setLoading(true);
      // Get device timezone
      const deviceTz = Localization.timezone;
      setDeviceTimezone(deviceTz);

      // Get stored timezone preference
      const storedTimezone = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedTimezone) {
        setSelectedTimezone(storedTimezone);
      } else {
        // If no stored preference, check if device is in Manila timezone
        const isManilaTZ = deviceTz === DEFAULT_TIMEZONE;
        if (isManilaTZ) {
          setSelectedTimezone(DEFAULT_TIMEZONE);
        } else {
          // Prompt user about timezone difference
          Alert.alert(
            'Timezone Notice',
            'This app is designed for Manila timezone (GMT+8). Would you like to use Manila time or your local time?',
            [
              {
                text: 'Use Manila Time',
                onPress: () => handleTimezoneChange(DEFAULT_TIMEZONE),
              },
              {
                text: 'Use Local Time',
                onPress: () => handleTimezoneChange('auto'),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error initializing timezone:', error);
      Alert.alert('Error', 'Failed to initialize timezone settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = async (timezone) => {
    try {
      setSelectedTimezone(timezone);
      await AsyncStorage.setItem(STORAGE_KEY, timezone);
      
      // Update DateTimeService with new timezone
      const effectiveTimezone = timezone === 'auto' ? Localization.timezone : timezone;
      await DateTimeService.updateTimezone(effectiveTimezone);

      // Notify user about the change
      Alert.alert(
        'Timezone Updated',
        `App will now use ${timezone === 'auto' ? 'device timezone' : timezone} for all times.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error changing timezone:', error);
      Alert.alert('Error', 'Failed to update timezone settings');
    }
  };

  const getEffectiveTimezone = () => {
    return selectedTimezone === 'auto' ? deviceTimezone : selectedTimezone;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading timezone settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2E3A59" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timezone Settings</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content}>
          {timeZones.map((tz) => (
            <TouchableOpacity
              key={tz.value}
              style={[
                styles.timezoneItem,
                selectedTimezone === tz.value && styles.selectedItem,
              ]}
              onPress={() => handleTimezoneChange(tz.value)}
            >
              <Text style={styles.timezoneLabel}>{tz.label}</Text>
              {selectedTimezone === tz.value && (
                <MaterialIcons name="check" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>About Timezones</Text>
            <Text style={styles.infoText}>
              This app is optimized for Manila timezone (GMT+8). If you're in a different timezone,
              you can choose to use either Manila time or your local time for all app features.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1'
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E3A59',
    flex: 1,
    marginLeft: 16,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timezoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  timezoneLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  headerRight: {
    width: 40
  },
});

export default TimeZoneScreen; 