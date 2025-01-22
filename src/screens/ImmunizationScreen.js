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
import { DateTimeService } from '../services/DateTimeService';
import { format } from 'date-fns';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import BinibabyLogo from '../../assets/BinibabyIcon.png';

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

      // Create a map of vaccine history for quick lookup
      const vaccineHistory = {};
      const vaccineHistoryResponse = await immunizationApi.getVaccinationHistory(token);
      vaccineHistoryResponse.forEach(record => {
        vaccineHistory[record.vaccine_id] = record;
      });

      // Ensure each age group has a valid ID and proper date handling
      const validatedData = data.map((ageGroup, index) => ({
        ...ageGroup,
        id: ageGroup.id || index + 1,
        vaccines: ageGroup.vaccines.map(vaccine => {
          const historyRecord = vaccineHistory[vaccine.id];
          console.log('Processing vaccine:', {
            id: vaccine.id,
            historyRecord: historyRecord
          });
          
          return {
            ...vaccine,
            id: vaccine.id,
            // Map status and dates from history record if exists
            completed: historyRecord?.status === 'completed',
            given_at: historyRecord?.given_at,
            scheduled_date: historyRecord?.scheduled_date,
            administered_by: historyRecord?.administered_by,
            administered_at: historyRecord?.administered_at,
            notes: historyRecord?.notes
          };
        })
      }));

      console.log('Validated vaccination data:', validatedData);
      setVaccines(validatedData);
      
      // Also update vaccination history
      setVaccinationHistory(vaccineHistoryResponse);
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
        // For completed vaccines, use given_at date
        if (vaccine.completed && vaccine.given_at) {
          const localDate = DateTimeService.toLocalTime(new Date(vaccine.given_at));
          if (localDate) {
            const dateStr = format(localDate, 'yyyy-MM-dd');
            markedDates[dateStr] = {
              dots: [{
                key: vaccine.id,
                color: '#4CAF50', // Green for completed
              }],
              selected: true,
              selectedColor: 'rgba(74, 144, 226, 0.1)'
            };
          }
        }
        // For scheduled vaccines, use scheduled_date
        else if (!vaccine.completed && vaccine.scheduled_date) {
          const localDate = DateTimeService.toLocalTime(new Date(vaccine.scheduled_date));
          if (localDate) {
            const dateStr = format(localDate, 'yyyy-MM-dd');
            markedDates[dateStr] = {
              dots: [{
                key: vaccine.id,
                color: '#FF9800', // Orange for scheduled
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
    console.log('Getting vaccines for date:', {
      input: date,
      parsed: new Date(date)
    });

    const vaccinesOnDate = [];
    // Convert selected date to local time
    const localTargetDate = DateTimeService.toLocalTime(new Date(date));
    if (!localTargetDate) {
      console.error('Invalid target date:', date);
      return vaccinesOnDate;
    }

    const targetDateStr = format(localTargetDate, 'yyyy-MM-dd');
    console.log('Target date conversion:', {
      original: date,
      localDate: localTargetDate,
      formatted: targetDateStr
    });
    
    vaccines.forEach(ageGroup => {
      ageGroup.vaccines.forEach(vaccine => {
        let matchDate = null;
        
        // Check completed vaccines first
        if (vaccine.completed && vaccine.given_at) {
          matchDate = DateTimeService.toLocalTime(new Date(vaccine.given_at));
        }
        // Then check scheduled vaccines
        else if (!vaccine.completed && vaccine.scheduled_date) {
          matchDate = DateTimeService.toLocalTime(new Date(vaccine.scheduled_date));
        }

        if (matchDate) {
          const vaccineDateStr = format(matchDate, 'yyyy-MM-dd');
          console.log('Comparing dates:', {
            vaccineId: vaccine.id,
            targetDate: targetDateStr,
            vaccineDate: vaccineDateStr,
            matches: vaccineDateStr === targetDateStr
          });

          if (vaccineDateStr === targetDateStr) {
            vaccinesOnDate.push({
              ...vaccine,
              ageGroup: ageGroup.ageGroup,
              displayDate: DateTimeService.formatForDisplay(matchDate)
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
      const message = vaccinesOnDate.map(vaccine => {
        const status = vaccine.completed ? '✅ Completed' : '⏳ Scheduled';
        return `${vaccine.name}\n${status}\nAge Group: ${vaccine.ageGroup}\nDate: ${vaccine.displayDate}`;
      }).join('\n\n');

      Alert.alert(
        `Vaccines - ${DateTimeService.formatForDisplay(day.dateString)}`,
        message,
        [{ text: 'OK', style: 'cancel' }],
        { cancelable: true }
      );
    } else {
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

  const handleVaccineCompletion = async (completionDetails) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No token found');

        // Convert completion date to UTC for API
        const completionDate = DateTimeService.formatForAPI(new Date());
        
        if (!completionDate) {
            throw new Error('Invalid completion date');
        }

        await immunizationApi.markVaccineCompleted(token, {
            vaccine_id: selectedVaccineForCompletion.id,
            given_at: completionDate,
            administered_by: completionDetails.administered_by,
            administered_at: completionDetails.administered_at,
            notes: completionDetails.notes
        });

        // Close form and show success message
        setShowCompletionForm(false);
        Alert.alert('Success', 'Vaccine marked as completed successfully.');

        // Refresh the screen
        await loadVaccinations();

    } catch (error) {
        console.error('Error completing vaccination:', error);
        Alert.alert('Error', 'Failed to mark vaccine as completed. Please try again.');
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

        // Validate and convert schedule date
        if (!scheduleDetails.date) {
            throw new Error('No date selected');
        }

        console.log('Scheduling vaccine - Input date:', {
            raw: scheduleDetails.date,
            isDate: scheduleDetails.date instanceof Date,
            isoString: scheduleDetails.date.toISOString()
        });

        // Convert schedule date to UTC for API
        const scheduledDate = DateTimeService.formatForAPI(scheduleDetails.date);
        
        if (!scheduledDate) {
            throw new Error('Invalid schedule date');
        }

        console.log('Scheduling vaccine - Processed date:', {
            scheduledDate,
            localTime: DateTimeService.formatForDisplay(scheduleDetails.date)
        });

        await immunizationApi.scheduleVaccine(token, {
            vaccine_id: selectedVaccineForScheduling.id,
            scheduled_date: scheduledDate,
            notes: scheduleDetails.notes
        });

        // Close form and show success message
        setShowScheduleForm(false);
        Alert.alert('Success', 'Vaccine scheduled successfully.');

        // Refresh the screen
        await loadVaccinations();

    } catch (error) {
        console.error('Error scheduling vaccination:', error);
        Alert.alert('Error', 'Failed to schedule vaccination. Please try again.');
    }
  };

  // Helper functions for PDF generation
  const getTotalVaccineCount = () => {
    let total = 0;
    vaccines.forEach(ageGroup => {
      total += ageGroup.vaccines.length;
    });
    return total;
  };

  const getCompletedVaccineCount = () => {
    let completed = 0;
    vaccines.forEach(ageGroup => {
      ageGroup.vaccines.forEach(vaccine => {
        if (vaccine.completed) completed++;
      });
    });
    return completed;
  };

  const getChildInformation = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');
      
      const response = await axios.get(`${API_URL}/baby`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        return {
          firstName: response.data.data.name,
          lastName: '',
          dateOfBirth: response.data.data.birth_date
        };
      }
      
      throw new Error('No baby data found');
    } catch (error) {
      console.error('Error fetching baby information:', error);
      return {
        firstName: 'Your',
        lastName: 'Baby',
        dateOfBirth: new Date().toISOString()
      };
    }
  };

  const getBase64Logo = async () => {
    try {
      console.log('Starting logo conversion process...');

      // Load the asset synchronously first
      const asset = Asset.fromModule(require('../../assets/BinibabyIcon.png'));
      
      // Ensure the asset is downloaded
      if (!asset.downloaded) {
        console.log('Downloading asset...');
        await asset.downloadAsync();
      }

      // On Android, we need to use the local file system
      if (Platform.OS === 'android') {
        // Get the file extension from the URI
        const extension = asset.localUri ? asset.localUri.split('.').pop() : 'png';
        
        // Create a local copy of the file
        const localPath = `${FileSystem.cacheDirectory}logo.${extension}`;
        
        // Copy the file to local storage
        await FileSystem.copyAsync({
          from: asset.localUri || asset.uri,
          to: localPath
        });

        console.log('File copied to local storage:', localPath);

        // Read the local file
        const base64Data = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64
        });

        // Clean up the temporary file
        await FileSystem.deleteAsync(localPath, { idempotent: true });

        return `data:image/png;base64,${base64Data}`;
      } else {
        // For iOS, we can read the asset directly
        const base64Data = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        return `data:image/png;base64,${base64Data}`;
      }
    } catch (error) {
      console.error('Error in getBase64Logo:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const handleDownloadSchedule = async () => {
    try {
      setDownloading(true);
      console.log('Starting PDF generation process...');

      // Get logo first
      let logoBase64;
      try {
        console.log('Attempting to load logo...');
        logoBase64 = await getBase64Logo();
        
        if (!logoBase64 || !logoBase64.startsWith('data:image/png;base64,')) {
          throw new Error('Invalid logo data format');
        }
        
        console.log('Logo loaded successfully, data length:', logoBase64.length);
      } catch (logoError) {
        console.error('Logo loading error:', logoError);
        Alert.alert(
          'Error',
          'Failed to load logo for PDF generation. Please try again.'
        );
        return;
      }

      // Get other data
      const [childInfo, token] = await Promise.all([
        getChildInformation(),
        AsyncStorage.getItem('userToken')
      ]);

      if (!token) throw new Error('No token found');

      const childName = childInfo.firstName;
      const dateOfBirth = childInfo.dateOfBirth ? 
        DateTimeService.formatForDisplay(new Date(childInfo.dateOfBirth)) : 
        'Not specified';

      console.log('Generating HTML content...');

      // Generate HTML content with embedded logo
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
              body { 
                font-family: 'Poppins', Arial, sans-serif; 
                padding: 0; 
                margin: 0;
                color: #2E3A59;
              }
              .header { 
                background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
                padding: 40px;
                color: white;
                margin-bottom: 40px;
              }
              .header-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 30px;
              }
              .logo-container {
                width: 80px;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border-radius: 50%;
                padding: 10px;
                margin-right: 20px;
              }
              .logo {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              .header-text {
                flex: 1;
              }
              .title { 
                font-size: 28px; 
                font-weight: 700;
                margin: 0 0 10px 0;
              }
              .subtitle { 
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
              }
              .report-info {
                background: #F8FAFC;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 40px;
                border: 1px solid #E2E8F0;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }
              .info-item {
                display: flex;
                flex-direction: column;
              }
              .info-label {
                font-size: 14px;
                color: #64748B;
                margin-bottom: 4px;
              }
              .info-value {
                font-size: 16px;
                font-weight: 500;
                color: #1E293B;
              }
              .section { 
                padding: 0 40px;
                margin-bottom: 30px; 
              }
              .section-title { 
                font-size: 20px; 
                font-weight: 600; 
                color: #1E293B;
                border-bottom: 2px solid #E2E8F0;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .vaccine-item {
                background: white;
                border: 1px solid #E2E8F0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              }
              .age-group {
                font-size: 18px;
                font-weight: 600;
                color: #1E293B;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #E2E8F0;
              }
              .vaccine-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
              }
              .vaccine-card {
                background: #F8FAFC;
                border-radius: 8px;
                padding: 15px;
              }
              .vaccine-name {
                font-size: 16px;
                font-weight: 500;
                color: #1E293B;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .status-indicator {
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .status-completed {
                background: #DCFCE7;
                color: #166534;
              }
              .status-scheduled {
                background: #FEF3C7;
                color: #92400E;
              }
              .status-pending {
                background: #F1F5F9;
                color: #64748B;
              }
              .vaccine-date {
                font-size: 14px;
                color: #64748B;
                margin-top: 4px;
              }
              .footer {
                margin: 40px;
                padding-top: 20px;
                border-top: 1px solid #E2E8F0;
                text-align: center;
                font-size: 12px;
                color: #64748B;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <div class="logo-container">
                  <img 
                    src="${logoBase64}" 
                    class="logo" 
                    alt="Binibaby Logo"
                    style="width: 100%; height: 100%; object-fit: contain;"
                  />
                </div>
                <div class="header-text">
                  <h1 class="title">Vaccination Schedule Report</h1>
                  <p class="subtitle">Generated on ${DateTimeService.formatForDisplay(new Date())}</p>
                </div>
              </div>
            </div>

            <div class="report-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Child's Name</span>
                  <span class="info-value">${childName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date of Birth</span>
                  <span class="info-value">${dateOfBirth}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Vaccines</span>
                  <span class="info-value">${getTotalVaccineCount()} vaccines</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Completed Vaccines</span>
                  <span class="info-value">${getCompletedVaccineCount()} completed</span>
                </div>
              </div>
            </div>

            <div class="section">
              ${vaccines.map(ageGroup => `
                <div class="vaccine-item">
                  <div class="age-group">${ageGroup.ageGroup}</div>
                  <div class="vaccine-grid">
                    ${ageGroup.vaccines.map(vaccine => `
                      <div class="vaccine-card">
                        <div class="vaccine-name">
                          ${vaccine.name}
                          <span class="status-indicator ${
                            vaccine.completed ? 'status-completed' : 
                            vaccine.scheduled_date ? 'status-scheduled' : 
                            'status-pending'
                          }">
                            ${
                              vaccine.completed ? '✓ Completed' : 
                              vaccine.scheduled_date ? '⏳ Scheduled' : 
                              '○ Pending'
                            }
                          </span>
                        </div>
                        ${vaccine.completed && vaccine.given_at ? 
                          `<div class="vaccine-date">Completed on: ${DateTimeService.formatForDisplay(new Date(vaccine.given_at))}</div>` :
                          vaccine.scheduled_date ? 
                          `<div class="vaccine-date">Scheduled for: ${DateTimeService.formatForDisplay(new Date(vaccine.scheduled_date))}</div>` :
                          ''
                        }
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              <p>This document was generated automatically by BiniBaby. Please consult with your healthcare provider for any questions.</p>
              <p>Generated on ${DateTimeService.formatForDisplay(new Date())}</p>
            </div>
          </body>
        </html>
      `;

      console.log('Generating PDF...');

      // Generate PDF with base64 option set to false
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      console.log('PDF generated successfully at:', uri);

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Vaccination Schedule'
        });
        console.log('PDF shared successfully');
      } else {
        throw new Error('Sharing is not available on this device');
      }

    } catch (error) {
      console.error('Error in handleDownloadSchedule:', error);
      Alert.alert(
        'Error',
        `Failed to download vaccination schedule: ${error.message}`
      );
    } finally {
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
      key={`vaccine-${vaccine.id}-${ageGroup.id}`}
      style={styles.vaccineItem}
      onPress={() => {
        if (vaccine.completed) {
          Alert.alert('Already Completed', 'This vaccine has already been administered.');
        } else if (vaccine.scheduled_date) {
          Alert.alert(
            'Scheduled',
            `This vaccine is scheduled for ${DateTimeService.formatForDisplay(vaccine.scheduled_date)}`,
            [
              { text: 'OK' },
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
                text: 'Reschedule',
                onPress: () => {
                  setSelectedVaccineForScheduling({ ...vaccine, ageGroup: ageGroup.ageGroup });
                  setShowScheduleForm(true);
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
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
          name={vaccine.completed ? "check-circle" : (vaccine.scheduled_date ? "event" : "radio-button-unchecked")}
          size={24}
          color={vaccine.completed ? "#4CAF50" : (vaccine.scheduled_date ? "#FF9800" : "#BDBDBD")}
          style={styles.vaccineIcon}
        />
        <View style={styles.vaccineDetails}>
          <Text style={[
            styles.vaccineName,
            vaccine.completed && styles.vaccineCompleted,
            vaccine.scheduled_date && !vaccine.completed && styles.vaccineScheduled
          ]}>
            {vaccine.name}
          </Text>
          {vaccine.completed && vaccine.given_at && (
            <Text style={styles.vaccineDate}>
              Completed on: {DateTimeService.formatForDisplay(new Date(vaccine.given_at))}
            </Text>
          )}
          {!vaccine.completed && vaccine.scheduled_date && (
            <Text style={[styles.vaccineDate, styles.scheduledDate]}>
              Scheduled for: {DateTimeService.formatForDisplay(new Date(vaccine.scheduled_date))}
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
                        {DateTimeService.formatForDisplay(
                          record.status === 'completed' ? record.given_at : record.scheduled_date
                        )}
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