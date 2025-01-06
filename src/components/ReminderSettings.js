import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { immunizationApi } from '../api/immunization';
import { MaterialIcons } from '@expo/vector-icons';

const ReminderSettings = ({ visible, onSave, onClose }) => {
  const [enabled, setEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(7);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const settings = await immunizationApi.getReminderSettings();
      setEnabled(settings.enabled);
      setReminderDays(settings.reminderDays);
      setReminderTime(settings.reminderTime);
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const settings = {
        enabled,
        reminderDays,
        reminderTime
      };
      
      await immunizationApi.updateReminder(settings);
      onSave(settings);
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setReminderTime(`${hours}:${minutes}`);
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
          
          <View style={styles.settingRow}>
            <Text>Enable Reminders</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
            />
          </View>

          {enabled && (
            <>
              <View style={styles.settingRow}>
                <Text>Remind me</Text>
                <Picker
                  selectedValue={reminderDays}
                  style={styles.picker}
                  onValueChange={setReminderDays}
                >
                  {[1, 2, 3, 5, 7, 14].map(days => (
                    <Picker.Item
                      key={days}
                      label={`${days} day${days > 1 ? 's' : ''} before`}
                      value={days}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.settingRow}>
                <Text>Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <Text>{reminderTime}</Text>
                </TouchableOpacity>
              </View>

              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const [hours, minutes] = reminderTime.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours, 10));
                    date.setMinutes(parseInt(minutes, 10));
                    return date;
                  })()}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  picker: {
    width: 150,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default ReminderSettings; 