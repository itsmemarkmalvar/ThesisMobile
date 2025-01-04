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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  useEffect(() => {
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

      setReminderEnabled(settings.enabled);
      setShowReminderSettings(false);
      
      // Update reminders for all upcoming vaccines
      if (settings.enabled) {
        for (const ageGroup of vaccines) {
          for (const vaccine of ageGroup.vaccines) {
            if (!vaccine.completed && vaccine.date) {
              await immunizationApi.updateReminder(token, {
                vaccineId: vaccine.id,
                enabled: true,
                days: settings.reminderDays,
                time: settings.reminderTime
              });
              scheduleVaccineReminder(vaccine, vaccine.date, settings);
            }
          }
        }
      } else {
        // Cancel all reminders if disabled
        for (const ageGroup of vaccines) {
          for (const vaccine of ageGroup.vaccines) {
            await immunizationApi.updateReminder(token, {
              vaccineId: vaccine.id,
              enabled: false
            });
            cancelVaccineReminder(vaccine.id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
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
          name={vaccine.completed ? "check-circle" : "radio-button-unchecked"}
          size={24}
          color={vaccine.completed ? "#4CAF50" : "#BDBDBD"}
          style={styles.vaccineIcon}
        />
        <View style={styles.vaccineDetails}>
          <Text style={[
            styles.vaccineName,
            vaccine.completed && styles.vaccineCompleted
          ]}>
            {vaccine.name}
          </Text>
          {vaccine.completed && vaccine.date && (
            <Text style={styles.vaccineDate}>
              Completed on: {new Date(vaccine.date).toLocaleDateString()}
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
        <Text style={styles.headerTitle}>Immunization</Text>
      </View>
      <View style={styles.headerRight}>
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
    } catch (error) {
      console.error('Error loading vaccination history:', error);
      Alert.alert('Error', 'Failed to load vaccination history');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {viewMode === 'list' ? (
        <ScrollView style={styles.content}>
          {vaccines.map((ageGroup) => (
            <View key={`age-group-${ageGroup.id || 'default'}-${ageGroup.ageGroup}`} style={styles.ageGroupContainer}>
              <Text style={styles.ageGroupTitle}>{ageGroup.ageGroup}</Text>
              {ageGroup.vaccines.map((vaccine) => renderVaccineItem(vaccine, ageGroup))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.calendarContainer}>
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
      />

      <VaccineScheduleForm
        visible={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSave={handleScheduleVaccine}
        vaccine={selectedVaccineForScheduling}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
});

export default ImmunizationScreen; 