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
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTimezone } from '../context/TimezoneContext';
import { DateTimeService } from '../services/DateTimeService';

const REMINDER_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

const EditAppointmentScreen = () => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [appointmentData, setAppointmentData] = useState(null);
  const [localCache, setLocalCache] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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
  const route = useRoute();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;
  const { timezone } = useTimezone();

  // Convert UTC to local time manually to ensure correct offset
  const convertToLocal = (utcString) => {
    try {
      const utcDate = new Date(utcString);
      // For Manila (UTC+8), add 8 hours
      const localDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
      
      // Get hours and minutes after +8 offset
      const hours = localDate.getUTCHours();
      const minutes = localDate.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      // Format the display time manually
      const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      const displayDate = localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      console.log('Manual timezone conversion:', {
        utc: utcString,
        local: {
          iso: localDate.toISOString(),
          display: `${displayDate}, ${displayTime}`,
          computed: {
            utcHours: localDate.getUTCHours(),
            displayHours,
            ampm
          }
        },
        timezone,
        offset: '+8 hours'
      });
      
      return localDate;
    } catch (error) {
      console.error('Error in manual conversion:', error);
      return null;
    }
  };

  // Convert local time back to UTC
  const convertToUTC = (localDate) => {
    try {
      // For Manila (UTC+8), subtract 8 hours
      const utcDate = new Date(localDate.getTime() - (8 * 60 * 60 * 1000));
      
      // Get hours and minutes for display
      const hours = localDate.getUTCHours();
      const minutes = localDate.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      // Format the display time manually
      const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      const displayDate = localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      console.log('Manual UTC conversion:', {
        local: {
          iso: localDate.toISOString(),
          display: `${displayDate}, ${displayTime}`,
          computed: {
            utcHours: localDate.getUTCHours(),
            displayHours,
            ampm
          }
        },
        utc: utcDate.toISOString(),
        timezone,
        offset: '-8 hours'
      });
      
      return utcDate;
    } catch (error) {
      console.error('Error in UTC conversion:', error);
      return null;
    }
  };

  // Load appointment data
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setLoading(true);
        const data = await HealthService.getAppointment(appointmentId);
        console.log('Loaded appointment:', data);
        
        if (!data || !data.appointment_date) {
          throw new Error('Invalid appointment data received');
        }

        // Store the complete appointment data
        setAppointmentData(data);
        
        // Convert UTC to local time
        const localDate = convertToLocal(data.appointment_date);
        if (!localDate) {
          throw new Error('Invalid appointment date');
        }
        
        setLocalCache(localDate);
        
        setFormData({
          doctor_name: data.doctor_name || '',
          clinic_location: data.clinic_location || '',
          purpose: data.purpose || '',
          notes: data.notes || '',
          status: data.status || 'scheduled',
          reminder_enabled: data.reminder_enabled ?? true,
          reminder_minutes_before: data.reminder_minutes_before || 60,
        });
      } catch (error) {
        console.error('Error loading appointment:', error);
        setErrors({
          submit: 'Failed to load appointment details. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  // Update local cache when timezone changes
  useEffect(() => {
    if (appointmentData?.appointment_date) {
      const localDate = convertToLocal(appointmentData.appointment_date);
      if (localDate) {
        setLocalCache(localDate);
      }
    }
  }, [timezone]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed' && localCache) {
      // Create new date preserving current time
      const newDate = new Date(localCache);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      
      // Convert to UTC for storage
      const utcDate = convertToUTC(newDate);
      if (utcDate) {
        const utcString = utcDate.toISOString();
        console.log('Date changed:', {
          previous: appointmentData?.appointment_date,
          newLocal: {
            iso: newDate.toISOString(),
            display: newDate.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          },
          newUtc: utcString,
          timezone
        });
        
        setAppointmentData(prev => ({
          ...prev,
          appointment_date: utcString
        }));
        setLocalCache(newDate);
      }
    }
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate && event.type !== 'dismissed' && localCache) {
      // Create new date preserving current date
      const newDate = new Date(localCache);
      
      // Get the selected hours and minutes in local time
      const selectedHours = selectedDate.getHours();
      const selectedMinutes = selectedDate.getMinutes();
      
      // Set the time components
      newDate.setUTCHours(selectedHours);
      newDate.setUTCMinutes(selectedMinutes);
      newDate.setUTCSeconds(0);
      newDate.setUTCMilliseconds(0);
      
      // Convert to UTC by subtracting 8 hours
      const utcDate = new Date(newDate.getTime() - (8 * 60 * 60 * 1000));
      
      if (utcDate) {
        const utcString = utcDate.toISOString();
        
        // For logging, get the actual local time display
        const localHours = newDate.getUTCHours();
        const localMinutes = newDate.getUTCMinutes();
        const ampm = localHours >= 12 ? 'PM' : 'AM';
        const displayHours = localHours % 12 || 12;
        const displayTime = `${String(displayHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')} ${ampm}`;
        
        console.log('Time changed:', {
          previous: appointmentData?.appointment_date,
          newLocal: {
            iso: newDate.toISOString(),
            display: `${newDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}, ${displayTime}`,
            debug: {
              selectedHours,
              selectedMinutes,
              localHours,
              displayHours,
              ampm
            }
          },
          newUtc: utcString,
          timezone
        });
        
        setAppointmentData(prev => ({
          ...prev,
          appointment_date: utcString
        }));
        setLocalCache(newDate);
      }
    }
  };

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
    
    // Validate against current time
    if (!localCache) {
      newErrors.submit = 'Please select a valid appointment date and time';
    } else {
      const now = DateTimeService.getCurrentTime();
      if (localCache < now) {
        newErrors.submit = 'Appointment date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!appointmentData?.appointment_date) {
        throw new Error('Invalid appointment date');
      }

      console.log('Submitting appointment:', {
        utc: appointmentData.appointment_date,
        local: localCache.toISOString(),
        timezone
      });

      await HealthService.updateAppointment(appointmentId, {
        ...formData,
        appointment_date: appointmentData.appointment_date,
        timezone
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setErrors({
        submit: 'Failed to update appointment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
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
              Edit Appointment
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
                  Date: {localCache ? localCache.toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Select date'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateButton}
                  contentStyle={styles.dateButtonContent}
                  labelStyle={styles.dateButtonLabel}
                  textColor="#1976D2"
                >
                  Time: {localCache ? `${String(localCache.getUTCHours() % 12 || 12).padStart(2, '0')}:${String(localCache.getUTCMinutes()).padStart(2, '0')} ${localCache.getUTCHours() >= 12 ? 'PM' : 'AM'}` : 'Select time'}
                </Button>
                <Text style={styles.timezoneInfo}>
                  Times are shown in {timezone}
                </Text>
              </View>

              {showDatePicker && localCache && (
                <DateTimePicker
                  value={localCache}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && localCache && (
                <DateTimePicker
                  value={localCache}
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
                />

                <View style={styles.reminderSection}>
                  <View style={styles.switchContainer}>
                    <Text variant="bodyLarge">Enable Reminder</Text>
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
                    Update Appointment
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
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 56,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
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
  },
  dateButtonContent: {
    height: 48,
  },
  dateButtonLabel: {
    fontSize: 16,
  },
  formSection: {
    gap: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  reminderSection: {
    marginTop: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  reminderScroll: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginRight: 16,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#1976D2',
  },
  cancelButton: {
    borderColor: '#1976D2',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  timezoneInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  }
});

export default EditAppointmentScreen; 