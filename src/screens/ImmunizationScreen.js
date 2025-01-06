import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Switch,
  PermissionsAndroid,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { API_URL } from '../config';
import VaccineCalendar from '../components/VaccineCalendar';
import { setupNotifications, scheduleVaccineReminder, cancelVaccineReminder } from '../utils/notifications';
import ReminderSettings from '../components/ReminderSettings';
import { immunizationApi } from '../api/immunization';
import { vaccineInfo } from '../data/vaccineInfo';
import VaccineCompletionForm from '../components/VaccineCompletionForm';
import VaccinationHistory from '../components/VaccinationHistory';
import VaccineScheduleForm from '../components/VaccineScheduleForm';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ImmunizationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [vaccines, setVaccines] = useState([
    {
      id: 1,
      ageGroup: 'Birth',
      vaccines: [
        { id: 'bcg', name: 'BCG', completed: false, date: null },
        { id: 'hepb1', name: 'Hepatitis B (1st dose)', completed: false, date: null },
      ]
    },
    {
      id: 2,
      ageGroup: '6 Weeks',
      vaccines: [
        { id: 'dtap1', name: 'DTaP (1st dose)', completed: false, date: null },
        { id: 'ipv1', name: 'IPV (1st dose)', completed: false, date: null },
        { id: 'hib1', name: 'Hib (1st dose)', completed: false, date: null },
        { id: 'pcv1', name: 'PCV (1st dose)', completed: false, date: null },
        { id: 'rv1', name: 'Rotavirus (1st dose)', completed: false, date: null },
      ]
    },
    {
      id: 3,
      ageGroup: '10 Weeks',
      vaccines: [
        { id: 'dtap2', name: 'DTaP (2nd dose)', completed: false, date: null },
        { id: 'ipv2', name: 'IPV (2nd dose)', completed: false, date: null },
        { id: 'hib2', name: 'Hib (2nd dose)', completed: false, date: null },
        { id: 'pcv2', name: 'PCV (2nd dose)', completed: false, date: null },
        { id: 'rv2', name: 'Rotavirus (2nd dose)', completed: false, date: null },
      ]
    },
    {
      id: 4,
      ageGroup: '14 Weeks',
      vaccines: [
        { id: 'dtap3', name: 'DTaP (3rd dose)', completed: false, date: null },
        { id: 'ipv3', name: 'IPV (3rd dose)', completed: false, date: null },
        { id: 'hib3', name: 'Hib (3rd dose)', completed: false, date: null },
        { id: 'pcv3', name: 'PCV (3rd dose)', completed: false, date: null },
        { id: 'rv3', name: 'Rotavirus (3rd dose)', completed: false, date: null },
      ]
    },
    {
      id: 5,
      ageGroup: '6 Months',
      vaccines: [
        { id: 'hepb2', name: 'Hepatitis B (2nd dose)', completed: false, date: null },
        { id: 'flu1', name: 'Influenza (1st dose)', completed: false, date: null },
      ]
    },
    {
      id: 6,
      ageGroup: '9 Months',
      vaccines: [
        { id: 'mmr1', name: 'MMR (1st dose)', completed: false, date: null },
        { id: 'var1', name: 'Varicella (1st dose)', completed: false, date: null },
      ]
    }
  ]);
  const [viewMode, setViewMode] = useState('list');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [completionDetails, setCompletionDetails] = useState({
    notes: '',
    administered_by: '',
    administered_at: ''
  });
  const [vaccinationHistory, setVaccinationHistory] = useState([]);
  const [selectedVaccineForCompletion, setSelectedVaccineForCompletion] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedVaccineForScheduling, setSelectedVaccineForScheduling] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Push notifications are required for vaccination reminders. Please enable them in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
    setupNotifications();
    loadVaccinations();
    loadVaccinationHistory();
  }, []);

  const loadVaccinations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      console.log('Loading vaccinations...');
      const data = await immunizationApi.getVaccines(token);
      console.log('Received vaccination data:', data);

      // Ensure each age group has a valid ID
      const validatedData = data.map((ageGroup, index) => ({
        ...ageGroup,
        id: ageGroup.id || index + 1, // Use existing ID or generate one based on index
        vaccines: ageGroup.vaccines.map(vaccine => ({
          ...vaccine,
          id: vaccine.id || `vaccine-${index}-${Math.random().toString(36).substr(2, 9)}` // Ensure each vaccine has an ID
        }))
      }));

      setVaccines(validatedData);
    } catch (error) {
      console.error('Error loading vaccinations:', error);
      Alert.alert('Error', 'Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  };

  const getMarkedDates = () => {
    const markedDates = {};
    vaccines.forEach(ageGroup => {
      ageGroup.vaccines.forEach(vaccine => {
        if (vaccine.date) {
          const dateStr = new Date(vaccine.date).toISOString().split('T')[0];
          if (markedDates[dateStr]) {
            markedDates[dateStr].dots.push({
              key: vaccine.id,
              color: vaccine.completed ? '#4CAF50' : '#FF9800',
            });
          } else {
            markedDates[dateStr] = {
              dots: [{
                key: vaccine.id,
                color: vaccine.completed ? '#4CAF50' : '#FF9800',
              }],
              selected: true,
              selectedColor: 'rgba(74, 144, 226, 0.1)'
            };
          }
        }
      });
    });
    return markedDates;
  };

  const getVaccinesForDate = (date) => {
    const vaccinesOnDate = [];
    vaccines.forEach(ageGroup => {
      ageGroup.vaccines.forEach(vaccine => {
        if (vaccine.date) {
          const vaccineDate = new Date(vaccine.date).toISOString().split('T')[0];
          if (vaccineDate === date) {
            vaccinesOnDate.push({
              ...vaccine,
              ageGroup: ageGroup.ageGroup
            });
          }
        }
      });
    });
    return vaccinesOnDate;
  };

  const handleDayPress = (day) => {
    const vaccinesOnDate = getVaccinesForDate(day.dateString);
    if (vaccinesOnDate.length > 0) {
      // Create a formatted message for the vaccines
      const message = vaccinesOnDate.map(vaccine => {
        const status = vaccine.completed ? '✅ Completed' : '⏳ Scheduled';
        return `${vaccine.name}\n${status}\nAge Group: ${vaccine.ageGroup}`;
      }).join('\n\n');

      Alert.alert(
        `Vaccines - ${new Date(day.dateString).toLocaleDateString()}`,
        message,
        [
          { 
            text: 'OK',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );
    } else {
      // Optionally show a message when no vaccines are scheduled for this date
      Alert.alert(
        'No Vaccines',
        'No vaccines are scheduled or completed for this date.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleVaccine = async (ageGroupId, vaccineId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const vaccine = vaccines
        .find(g => g.id === ageGroupId)
        ?.vaccines.find(v => v.id === vaccineId);

      if (!vaccine) throw new Error('Vaccine not found');

      if (vaccine.completed) {
        Alert.alert('Already Completed', 'This vaccine has already been administered.');
        return;
      }

      // Set selected vaccine and show completion form
      setSelectedVaccineForCompletion({
        ...vaccine,
        ageGroup: vaccines.find(g => g.id === ageGroupId)?.ageGroup
      });
      setCompletionDetails({
        notes: '',
        administered_by: '',
        administered_at: ''
      });
      setShowCompletionForm(true);

    } catch (error) {
      console.error('Error preparing vaccine completion:', error);
      Alert.alert('Error', 'Failed to prepare vaccine completion');
    }
  };

  const handleVaccineCompletion = async (details) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const now = new Date().toISOString();
      await immunizationApi.markVaccineCompleted(token, {
        vaccine_id: selectedVaccineForCompletion.id,
        given_at: now,
        administered_by: details.administered_by,
        administered_at: details.administered_at,
        notes: details.notes
      });

      // Update local state
      setVaccines(prevVaccines => 
        prevVaccines.map(ageGroup => ({
          ...ageGroup,
          vaccines: ageGroup.vaccines.map(v => 
            v.id === selectedVaccineForCompletion.id
              ? { ...v, completed: true, date: now }
              : v
          )
        }))
      );

      // Cancel any existing reminders for this vaccine
      cancelVaccineReminder(selectedVaccineForCompletion.id);

      // Refresh vaccination history
      loadVaccinationHistory();

      // Close form and show success message
      setShowCompletionForm(false);
      Alert.alert('Success', 'Vaccine marked as completed successfully.');

    } catch (error) {
      console.error('Error completing vaccination:', error);
      Alert.alert('Error', 'Failed to complete vaccination');
    }
  };

  const handleReminderSettingsSave = async (settings) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      // Update the UI state
      setReminderEnabled(settings.enabled);
      
      // Save settings to AsyncStorage
      await AsyncStorage.setItem('vaccineReminderSettings', JSON.stringify(settings));

      // Update reminders for all upcoming vaccines
      if (settings.enabled) {
        for (const ageGroup of vaccines) {
          for (const vaccine of ageGroup.vaccines) {
            if (!vaccine.completed && vaccine.date) {
              try {
                // Schedule local notification
                const trigger = new Date(vaccine.date);
                const [hours, minutes] = settings.reminderTime.split(':');
                
                trigger.setDate(trigger.getDate() - settings.reminderDays);
                trigger.setHours(parseInt(hours), parseInt(minutes), 0);

                // Cancel any existing reminder first
                await cancelVaccineReminder(vaccine.id);

                // Schedule new reminder
                const notificationId = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Upcoming Vaccination',
                    body: `${vaccine.name} is due in ${settings.reminderDays} days`,
                    data: { vaccineId: vaccine.id, dueDate: vaccine.date },
                    categoryIdentifier: 'VACCINE_REMINDER',
                    sound: true,
                  },
                  trigger,
                });

                // Store notification ID
                const notifications = await AsyncStorage.getItem('vaccineNotifications');
                const notificationsObj = notifications ? JSON.parse(notifications) : {};
                notificationsObj[vaccine.id] = notificationId;
                await AsyncStorage.setItem('vaccineNotifications', JSON.stringify(notificationsObj));
              } catch (err) {
                console.error(`Error scheduling reminder for vaccine ${vaccine.id}:`, err);
              }
            }
          }
        }
      } else {
        // Cancel all reminders if disabled
        for (const ageGroup of vaccines) {
          for (const vaccine of ageGroup.vaccines) {
            try {
              await cancelVaccineReminder(vaccine.id);
            } catch (err) {
              console.error(`Error canceling reminder for vaccine ${vaccine.id}:`, err);
            }
          }
        }
      }

      setShowReminderSettings(false);
      Alert.alert('Success', 'Reminder settings updated successfully');
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      Alert.alert('Error', 'Failed to update reminder settings. Please try again.');
    }
  };

  const handleScheduleVaccine = async (scheduleDetails) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      await immunizationApi.scheduleVaccine(token, {
        vaccine_id: selectedVaccineForScheduling.id,
        scheduled_date: scheduleDetails.date.toISOString(),
        notes: scheduleDetails.notes
      });

      // Update local state
      setVaccines(prevVaccines => 
        prevVaccines.map(ageGroup => ({
          ...ageGroup,
          vaccines: ageGroup.vaccines.map(v => 
            v.id === selectedVaccineForScheduling.id
              ? { ...v, date: scheduleDetails.date.toISOString() }
              : v
          )
        }))
      );

      // Get stored reminder settings
      const storedSettings = await AsyncStorage.getItem('vaccineReminderSettings');
      const settings = storedSettings ? JSON.parse(storedSettings) : {
        enabled: true,
        reminderDays: 7,
        reminderTime: '09:00'
      };

      // Set up reminder if enabled
      if (settings.enabled) {
        await scheduleVaccineReminder(selectedVaccineForScheduling, scheduleDetails.date, settings);
      }

      // Close form and show success message
      setShowScheduleForm(false);
      Alert.alert('Success', 'Vaccine scheduled successfully.');

    } catch (error) {
      console.error('Error scheduling vaccination:', error);
      Alert.alert('Error', 'Failed to schedule vaccination');
    }
  };

  const handleDownloadSchedule = async () => {
    try {
      setDownloading(true);

      // Get baby information and vaccination data
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      // Generate HTML content
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #2E3A59; }
              .subtitle { font-size: 16px; color: #666; }
              .section { margin-bottom: 30px; }
              .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #2E3A59;
                border-bottom: 2px solid #eee;
                padding-bottom: 5px;
                margin-bottom: 15px;
              }
              .vaccine-item {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 5px;
              }
              .vaccine-name {
                font-weight: bold;
                color: #2E3A59;
                margin-bottom: 5px;
              }
              .vaccine-details {
                font-size: 14px;
                color: #666;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Vaccination Schedule</div>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="section">
              <div class="section-title">Vaccination Schedule</div>
              ${vaccines.map(ageGroup => `
                <div class="vaccine-item">
                  <div class="vaccine-name">${ageGroup.ageGroup}</div>
                  <div class="vaccine-details">
                    ${ageGroup.vaccines.map(vaccine => `
                      <div>
                        ${vaccine.name} - 
                        ${vaccine.completed 
                          ? `✅ Completed on: ${new Date(vaccine.date).toLocaleDateString()}`
                          : vaccine.date 
                            ? `⏳ Scheduled for: ${new Date(vaccine.date).toLocaleDateString()}`
                            : '◯ Not scheduled'
                        }
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              This document was generated automatically. Please consult with your healthcare provider for any questions.
            </div>
          </body>
        </html>
      `;

      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Vaccination Schedule'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }

      setDownloading(false);
    } catch (error) {
      console.error('Error downloading schedule:', error);
      Alert.alert('Error', 'Failed to download vaccination schedule');
      setDownloading(false);
    }
  };

  const VaccineInfoModal = ({ vaccine, visible, onClose }) => {
    if (!vaccine) return null;

    const info = vaccineInfo[vaccine.id] || {};

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{vaccine.name}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Full Name</Text>
                <Text style={styles.infoText}>{info.fullName}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Description</Text>
                <Text style={styles.infoText}>{info.description}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>When to Get</Text>
                <Text style={styles.infoText}>{info.whenToGet}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Duration</Text>
                <Text style={styles.infoText}>{info.duration}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Side Effects</Text>
                <Text style={styles.infoText}>{info.sideEffects}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Importance</Text>
                <Text style={styles.infoText}>{info.importance}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderVaccineItem = (vaccine, ageGroup) => (
    <TouchableOpacity
      key={`vaccine-${ageGroup.id}-${vaccine.id}`}
      style={styles.vaccineItem}
      onPress={() => {
        if (vaccine.completed) {
          Alert.alert('Already Completed', 'This vaccine has already been administered.');
        } else if (vaccine.date) {
          Alert.alert(
            'Scheduled',
            `This vaccine is scheduled for ${new Date(vaccine.date).toLocaleDateString()}`,
            [
              { text: 'OK' },
              {
                text: 'Reschedule',
                onPress: () => {
                  setSelectedVaccineForScheduling({ ...vaccine, ageGroup: ageGroup.ageGroup });
                  setShowScheduleForm(true);
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Vaccine Options',
            'What would you like to do?',
            [
              {
                text: 'Schedule',
                onPress: () => {
                  setSelectedVaccineForScheduling({ ...vaccine, ageGroup: ageGroup.ageGroup });
                  setShowScheduleForm(true);
                }
              },
              {
                text: 'Mark as Completed',
                onPress: () => {
                  setSelectedVaccineForCompletion({ ...vaccine, ageGroup: ageGroup.ageGroup });
                  setCompletionDetails({
                    notes: '',
                    administered_by: '',
                    administered_at: ''
                  });
                  setShowCompletionForm(true);
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        }
      }}
    >
      <View style={styles.vaccineContent}>
        <MaterialIcons
          name={vaccine.completed ? "check-circle" : (vaccine.date ? "event" : "radio-button-unchecked")}
          size={24}
          color={vaccine.completed ? "#4CAF50" : (vaccine.date ? "#FF9800" : "#BDBDBD")}
          style={styles.vaccineIcon}
        />
        <View style={styles.vaccineDetails}>
          <Text style={[
            styles.vaccineName,
            vaccine.completed && styles.vaccineCompleted,
            vaccine.date && !vaccine.completed && styles.vaccineScheduled
          ]}>
            {vaccine.name}
          </Text>
          {vaccine.completed && vaccine.date && (
            <Text style={styles.vaccineDate}>
              Completed on: {new Date(vaccine.date).toLocaleDateString()}
            </Text>
          )}
          {!vaccine.completed && vaccine.date && (
            <Text style={[styles.vaccineDate, styles.scheduledDate]}>
              Scheduled for: {new Date(vaccine.date).toLocaleDateString()}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            setSelectedVaccine(vaccine);
            setInfoModalVisible(true);
          }}
        >
          <MaterialIcons name="info-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleDownloadSchedule}
          disabled={downloading}
        >
          <MaterialIcons name="download" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setShowReminderSettings(true)}
        >
          <MaterialIcons name="notifications" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
        >
          <MaterialIcons 
            name={viewMode === 'list' ? 'calendar-today' : 'list'} 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setShowHistory(true)}
        >
          <MaterialIcons name="history" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const loadVaccinationHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const history = await immunizationApi.getVaccinationHistory(token);
      setVaccinationHistory(history);
      return true; // Return success status
    } catch (error) {
      console.error('Error loading vaccination history:', error);
      Alert.alert(
        'Error',
        'Failed to load vaccination history. Please try again.'
      );
      return false; // Return failure status
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVaccinations();
      await loadVaccinationHistory();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {renderHeader()}
          <ActivityIndicator size="large" color="#0000ff" />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {renderHeader()}
        
        {viewMode === 'list' ? (
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
          >
            {vaccines.map((ageGroup) => (
              <View key={`age-group-${ageGroup.id || 'default'}-${ageGroup.ageGroup}`} style={styles.ageGroupContainer}>
                <Text style={styles.ageGroupTitle}>{ageGroup.ageGroup}</Text>
                {ageGroup.vaccines.map((vaccine) => renderVaccineItem(vaccine, ageGroup))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
          >
            <View style={styles.calendarCard}>
              <VaccineCalendar
                markedDates={getMarkedDates()}
                onDayPress={handleDayPress}
              />
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Completed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.legendText}>Scheduled</Text>
                </View>
              </View>
            </View>

            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Vaccination History</Text>
              </View>
              {vaccinationHistory.length > 0 ? (
                vaccinationHistory.map((record, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyVaccineName}>{record.vaccine_name}</Text>
                      <Text style={styles.historyDate}>
                        {record.status === 'completed' ? 'Completed on: ' : 'Scheduled for: '}
                        {new Date(record.status === 'completed' ? record.given_at : record.scheduled_date).toLocaleDateString()}
                      </Text>
                      {record.administered_by && (
                        <Text style={styles.historyAdministered}>
                          Administered by: {record.administered_by}
                        </Text>
                      )}
                      {record.notes && <Text style={styles.historyNotes}>{record.notes}</Text>}
                    </View>
                    <MaterialIcons
                      name={record.status === 'completed' ? "check-circle" : "event"}
                      size={24}
                      color={record.status === 'completed' ? "#4CAF50" : "#FF9800"}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>No vaccination history available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <VaccineInfoModal
          vaccine={selectedVaccine}
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
        />

        <ReminderSettings
          visible={showReminderSettings}
          onClose={() => setShowReminderSettings(false)}
          onSave={handleReminderSettingsSave}
        />

        <VaccineCompletionForm
          visible={showCompletionForm}
          onClose={() => setShowCompletionForm(false)}
          onSave={handleVaccineCompletion}
          vaccine={selectedVaccineForCompletion}
          details={completionDetails}
          setDetails={setCompletionDetails}
        />

        <VaccinationHistory
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          history={vaccinationHistory}
          onRefresh={loadVaccinationHistory}
        />

        <VaccineScheduleForm
          visible={showScheduleForm}
          onClose={() => setShowScheduleForm(false)}
          onSave={handleScheduleVaccine}
          vaccine={selectedVaccineForScheduling}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  ageGroupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  ageGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vaccineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vaccineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaccineIcon: {
    marginRight: 12,
  },
  vaccineDetails: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16,
    color: '#333',
  },
  vaccineCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  vaccineDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoButton: {
    padding: 8,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  vaccineScheduled: {
    color: '#FF9800',
  },
  scheduledDate: {
    color: '#FF9800',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  historyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyContent: {
    flex: 1,
    marginRight: 12,
  },
  historyVaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  historyAdministered: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyHistory: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ImmunizationScreen; 