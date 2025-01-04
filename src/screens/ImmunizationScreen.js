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

  useEffect(() => {
    setupNotifications();
  }, []);

  const handleDayPress = (day) => {
    // Handle calendar day press
    console.log('Selected day:', day);
  };

  const toggleVaccine = async (ageGroupId, vaccineId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      // Update local state
      setVaccines(prevVaccines => 
        prevVaccines.map(ageGroup => {
          if (ageGroup.id === ageGroupId) {
            return {
              ...ageGroup,
              vaccines: ageGroup.vaccines.map(vaccine => {
                if (vaccine.id === vaccineId) {
                  const newCompleted = !vaccine.completed;
                  const newDate = newCompleted ? new Date().toISOString() : null;

                  // Handle reminder
                  if (newCompleted) {
                    cancelVaccineReminder(vaccineId);
                  } else if (reminderEnabled) {
                    const reminderSettings = {
                      reminderDays: 7,
                      reminderTime: '09:00'
                    };
                    scheduleVaccineReminder(vaccine, newDate, reminderSettings);
                  }

                  return {
                    ...vaccine,
                    completed: newCompleted,
                    date: newDate
                  };
                }
                return vaccine;
              })
            };
          }
          return ageGroup;
        })
      );

      // TODO: Update backend
      // await axios.post(`${API_URL}/immunization/update`, {
      //   vaccineId,
      //   completed: !vaccine.completed,
      //   date: new Date().toISOString()
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Accept': 'application/json'
      //   }
      // });

    } catch (error) {
      console.error('Error updating vaccine status:', error);
      Alert.alert('Error', 'Failed to update vaccine status');
    }
  };

  const handleReminderSettingsSave = async (settings) => {
    setReminderEnabled(settings.enabled);
    setShowReminderSettings(false);
    
    // Update reminders for all upcoming vaccines
    if (settings.enabled) {
      vaccines.forEach(ageGroup => {
        ageGroup.vaccines.forEach(vaccine => {
          if (!vaccine.completed && vaccine.date) {
            scheduleVaccineReminder(vaccine, vaccine.date, settings);
          }
        });
      });
    } else {
      // Cancel all reminders if disabled
      vaccines.forEach(ageGroup => {
        ageGroup.vaccines.forEach(vaccine => {
          cancelVaccineReminder(vaccine.id);
        });
      });
    }
  };

  const VaccineInfoModal = ({ vaccine, visible, onClose }) => {
    if (!vaccine) return null;

    const vaccineInfo = {
      bcg: {
        fullName: 'Bacillus Calmette–Guérin vaccine',
        description: 'Protects against tuberculosis',
        sideEffects: 'May cause a small bump at injection site',
        importance: 'Critical for preventing childhood TB'
      },
      // Add info for other vaccines...
    };

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
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About</Text>
                <Text style={styles.infoText}>{info.fullName}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Description</Text>
                <Text style={styles.infoText}>{info.description}</Text>
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
      key={vaccine.id}
      style={styles.vaccineItem}
      onPress={() => toggleVaccine(ageGroup.id, vaccine.id)}
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
          <Text style={styles.headerTitle}>Immunization Schedule</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowReminderSettings(true)}
            >
              <MaterialIcons 
                name="notifications" 
                size={24} 
                color={reminderEnabled ? "#4A90E2" : "#BDBDBD"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <MaterialIcons 
                name="calendar-today" 
                size={24} 
                color="#4A90E2" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {showCalendar ? (
          <VaccineCalendar
            vaccines={vaccines}
            onDayPress={handleDayPress}
          />
        ) : (
          <ScrollView style={styles.content}>
            {vaccines.map((ageGroup) => (
              <View key={ageGroup.id} style={styles.ageGroupContainer}>
                <Text style={styles.ageGroupTitle}>{ageGroup.ageGroup}</Text>
                {ageGroup.vaccines.map((vaccine) => (
                  renderVaccineItem(vaccine, ageGroup)
                ))}
              </View>
            ))}
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
      </LinearGradient>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  infoSection: {
    marginBottom: 20,
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
});

export default ImmunizationScreen; 