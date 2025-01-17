import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Switch,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useTimezone } from '../context/TimezoneContext';
import { DateTimeService } from '../services/DateTimeService';

const REMINDER_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

const AddAppointmentScreen = () => {
  const { timezone } = useTimezone();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Initialize with current time
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const now = new Date();
    // Round to nearest future 30-minute interval
    const minutes = Math.ceil(now.getMinutes() / 30) * 30;
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Remove the timezone effect as it's causing issues
  // We'll handle timezone conversion only when sending to API

  const [formData, setFormData] = useState({
    doctor_name: '',
    clinic_location: '',
    purpose: '',
    notes: '',
    status: 'scheduled',
    reminder_enabled: true,
    reminder_minutes_before: 60,
  });

  const navigation = useNavigation();
  const theme = useTheme();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.doctor_name.trim()) {
      newErrors.doctor_name = 'Doctor name is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    
    // Validate against current time in user's timezone
    if (!appointmentDate) {
      newErrors.submit = 'Please select a valid appointment date and time';
    } else {
      const now = DateTimeService.getCurrentTime();
      if (appointmentDate < now) {
        newErrors.submit = 'Appointment date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      const newDate = new Date(appointmentDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      
      console.log('Date selected:', {
        current: appointmentDate.toISOString(),
        selected: selectedDate.toISOString(),
        new: newDate.toISOString(),
        displayDate: format(newDate, 'MMM d, yyyy'),
        displayTime: format(newDate, 'h:mm a')
      });
      
      setAppointmentDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      // Create new date object with current date components
      const newDate = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate(),
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        0,
        0
      );
      
      console.log('Time selected:', {
        selectedTime: format(selectedDate, 'HH:mm'),
        newLocalTime: format(newDate, 'HH:mm'),
        displayDateTime: format(newDate, 'MMM d, yyyy h:mm a'),
        timezone
      });
      
      setAppointmentDate(newDate);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create UTC date by subtracting 8 hours from Manila time
      const localDate = new Date(appointmentDate);
      const utcDate = new Date(localDate);
      utcDate.setHours(localDate.getHours() - 8);
      
      console.log('Appointment submission:', {
        localDateTime: format(localDate, 'yyyy-MM-dd HH:mm:ss'),
        localDisplay: format(localDate, 'MMM d, yyyy h:mm a'),
        utcDateTime: format(utcDate, 'yyyy-MM-dd HH:mm:ss'),
        timezone
      });

      // Ensure we're sending the correct UTC ISO string
      const appointmentData = {
        ...formData,
        appointment_date: format(utcDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        timezone
      };

      console.log('Submitting appointment with data:', appointmentData);
      await HealthService.createAppointment(appointmentData);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setErrors({
        submit: 'Failed to save appointment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['bottom']}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="titleLarge" style={styles.headerTitle}>
              Add Appointment
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              {errors.submit && (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {errors.submit}
                </HelperText>
              )}

              <View style={styles.dateTimeSection}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                  contentStyle={styles.dateButtonContent}
                  labelStyle={styles.dateButtonLabel}
                  textColor="#1976D2"
                >
                  Date: {format(appointmentDate, 'MMM d, yyyy')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateButton}
                  contentStyle={styles.dateButtonContent}
                  labelStyle={styles.dateButtonLabel}
                  textColor="#1976D2"
                >
                  Time: {format(appointmentDate, 'h:mm a')}
                </Button>
                <Text style={styles.timezoneInfo}>
                  Times are shown in {timezone}
                </Text>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              <View style={styles.formSection}>
                <TextInput
                  label="Doctor Name"
                  value={formData.doctor_name}
                  onChangeText={(text) => handleInputChange('doctor_name', text)}
                  style={styles.input}
                  error={!!errors.doctor_name}
                />
                <HelperText type="error" visible={!!errors.doctor_name}>
                  {errors.doctor_name}
                </HelperText>

                <TextInput
                  label="Clinic Location"
                  value={formData.clinic_location}
                  onChangeText={(text) => handleInputChange('clinic_location', text)}
                  style={styles.input}
                />

                <TextInput
                  label="Purpose"
                  value={formData.purpose}
                  onChangeText={(text) => handleInputChange('purpose', text)}
                  style={styles.input}
                  error={!!errors.purpose}
                  multiline
                  numberOfLines={3}
                />
                <HelperText type="error" visible={!!errors.purpose}>
                  {errors.purpose}
                </HelperText>

                <TextInput
                  label="Notes"
                  value={formData.notes}
                  onChangeText={(text) => handleInputChange('notes', text)}
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.reminderSection}>
                <View style={styles.switchContainer}>
                  <Text variant="bodyLarge" style={styles.switchLabel}>Enable Reminder</Text>
                  <Switch
                    value={formData.reminder_enabled}
                    onValueChange={(value) => handleInputChange('reminder_enabled', value)}
                  />
                </View>

                {formData.reminder_enabled && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Remind me before
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.reminderScroll}
                    >
                      <SegmentedButtons
                        value={formData.reminder_minutes_before}
                        onValueChange={(value) =>
                          handleInputChange('reminder_minutes_before', value)
                        }
                        buttons={REMINDER_OPTIONS}
                        style={styles.segmentedButtons}
                        theme={{
                          colors: {
                            secondaryContainer: 'rgba(255, 255, 255, 0.9)',
                            onSecondaryContainer: '#333',
                          }
                        }}
                      />
                    </ScrollView>
                  </>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                >
                  Save Appointment
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                  textColor="#1976D2"
                >
                  Cancel
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: 'transparent',
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  errorText: {
    marginBottom: 16,
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: 8,
  },
  dateButtonContent: {
    height: 48,
  },
  dateButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  reminderSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    color: '#333',
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
  },
  reminderScroll: {
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    padding: 8,
    backgroundColor: '#1976D2',
  },
  cancelButton: {
    padding: 8,
    borderColor: '#1976D2',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  timezoneInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  }
});

export default AddAppointmentScreen; 