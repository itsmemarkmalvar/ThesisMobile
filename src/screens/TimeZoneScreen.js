import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

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
  const [selectedTimeZone, setSelectedTimeZone] = useState('auto');

  useEffect(() => {
    loadTimeZone();
  }, []);

  const loadTimeZone = async () => {
    try {
      const savedTimeZone = await AsyncStorage.getItem('userTimeZone');
      if (savedTimeZone) {
        setSelectedTimeZone(savedTimeZone);
      }
    } catch (error) {
      console.error('Error loading timezone:', error);
    }
  };

  const handleTimeZoneSelect = async (timeZone) => {
    try {
      await AsyncStorage.setItem('userTimeZone', timeZone);
      setSelectedTimeZone(timeZone);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving timezone:', error);
    }
  };

  const getDeviceTimeZone = () => {
    return Localization.timezone;
  };

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
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Zone</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.currentTimeZone}>
              Current: {selectedTimeZone === 'auto' ? getDeviceTimeZone() : selectedTimeZone}
            </Text>

            {timeZones.map((tz, index) => (
              <TouchableOpacity
                key={tz.value}
                style={[
                  styles.timeZoneItem,
                  selectedTimeZone === tz.value && styles.selectedTimeZone,
                  index === timeZones.length - 1 && styles.lastItem
                ]}
                onPress={() => handleTimeZoneSelect(tz.value)}
              >
                <Text style={[
                  styles.timeZoneText,
                  selectedTimeZone === tz.value && styles.selectedText
                ]}>
                  {tz.label}
                </Text>
                {selectedTimeZone === tz.value && (
                  <MaterialIcons name="check" size={24} color="#4A90E2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  currentTimeZone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  timeZoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.8)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  selectedTimeZone: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 10,
  },
  timeZoneText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default TimeZoneScreen; 