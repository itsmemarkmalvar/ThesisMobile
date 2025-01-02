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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

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
  const [appointmentDate, setAppointmentDate] = useState(new Date());
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
  const { appointmentId } = route.params;

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await HealthService.getAppointment(appointmentId);
        setFormData({
          doctor_name: data.doctor_name,
          clinic_location: data.clinic_location || '',
          purpose: data.purpose,
          notes: data.notes || '',
          status: data.status,
          reminder_enabled: data.reminder_enabled,
          reminder_minutes_before: data.reminder_minutes_before,
        });
        setAppointmentDate(new Date(data.appointment_date));
      } catch (error) {
        console.error('Error fetching appointment:', error);
        setErrors({
          submit: 'Failed to load appointment details. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await HealthService.updateAppointment(appointmentId, {
        ...formData,
        appointment_date: appointmentDate,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setErrors({
        submit: 'Failed to update appointment. Please try again.',
      });
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="titleLarge" style={styles.title}>
            Edit Appointment
          </Text>

          {errors.submit && (
            <ErrorMessage message={errors.submit} />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            Date: {format(appointmentDate, 'MMM d, yyyy')}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={appointmentDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setAppointmentDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowTimePicker(true)}
            style={styles.dateButton}
          >
            Time: {format(appointmentDate, 'h:mm a')}
          </Button>

          {showTimePicker && (
            <DateTimePicker
              value={appointmentDate}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setAppointmentDate(selectedDate);
                }
              }}
            />
          )}

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
            >
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  dateButton: {
    marginVertical: 8,
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
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
});

export default EditAppointmentScreen; 