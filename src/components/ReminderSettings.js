import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReminderSettings = ({ visible, onClose, onSave }) => {
  const [enabled, setEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(7);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const saveSettings = async () => {
    const settings = {
      enabled,
      reminderDays,
      reminderTime: reminderTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
    };
    await AsyncStorage.setItem('reminderSettings', JSON.stringify(settings));
    onSave(settings);
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
          <Text style={styles.modalTitle}>Reminder Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Reminders</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={enabled ? '#4A90E2' : '#f4f3f4'}
            />
          </View>

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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveSettings}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ... styles for the reminder settings modal
});

export default ReminderSettings; 