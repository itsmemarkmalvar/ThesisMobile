import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReminderSettings = ({ visible, onClose, onSave }) => {
  const [enabled, setEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(7);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('vaccineReminderSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setEnabled(parsed.enabled);
        setReminderDays(parsed.reminderDays);
        if (parsed.reminderTime) {
          const [hours, minutes] = parsed.reminderTime.split(':');
          const time = new Date();
          time.setHours(parseInt(hours), parseInt(minutes), 0);
          setReminderTime(time);
        }
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const handleSave = async () => {
    const settings = {
      enabled,
      reminderDays,
      reminderTime: reminderTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
    };
    
    try {
      await AsyncStorage.setItem('vaccineReminderSettings', JSON.stringify(settings));
      onSave(settings);
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reminder Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Reminders</Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: '#767577', true: '#4A90E2' }}
                thumbColor={enabled ? '#FFF' : '#f4f3f4'}
              />
            </View>

            {enabled && (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Remind me before</Text>
                  <View style={styles.daysSelector}>
                    {[3, 5, 7, 14].map(days => (
                      <TouchableOpacity
                        key={days}
                        style={[
                          styles.dayButton,
                          reminderDays === days && styles.dayButtonActive
                        ]}
                        onPress={() => setReminderDays(days)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          reminderDays === days && styles.dayButtonTextActive
                        ]}>
                          {days} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.settingLabel}>Reminder Time</Text>
                  <Text style={styles.timeText}>
                    {reminderTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) setReminderTime(selectedTime);
                    }}
                  />
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '80%',
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
    maxHeight: '70%',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 5,
    marginBottom: 10,
  },
  dayButtonActive: {
    backgroundColor: '#4A90E2',
  },
  dayButtonText: {
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#FFF',
  },
  timeSelector: {
    marginBottom: 20,
  },
  timeText: {
    fontSize: 16,
    color: '#4A90E2',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    color: '#FFF',
  },
});

export default ReminderSettings; 