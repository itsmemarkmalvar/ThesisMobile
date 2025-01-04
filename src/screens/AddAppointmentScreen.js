import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';

const REMINDER_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

const AddAppointmentScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await HealthService.createAppointment({
        ...formData,
        appointment_date: appointmentDate,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setErrors({
        submit: 'Failed to save appointment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
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
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderHeader()}
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {errors.submit && (
              <HelperText type="error" visible={true}>
                {errors.submit}
              </HelperText>
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
                Save Appointment
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
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

export default AddAppointmentScreen; 