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
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTimezone } from '../context/TimezoneContext';

const EditDoctorVisitScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [visitDate, setVisitDate] = useState(new Date());
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState(null);
  const [showNextVisitDatePicker, setShowNextVisitDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    doctor_name: '',
    clinic_location: '',
    reason_for_visit: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    follow_up_instructions: '',
  });

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { visitId } = route.params;

  // Format date for display
  const formatDateTime = (date) => {
    if (!date) return '';
    // Ensure we're only working with the date part
    const dateOnly = format(date, 'yyyy-MM-dd');
    return format(parseISO(dateOnly), 'MMM d, yyyy');
  };

  // Format date for API - only send the date portion
  const formatForAPI = (date) => {
    if (!date) return null;
    // Only return the date portion in YYYY-MM-DD format
    return format(date, 'yyyy-MM-dd');
  };

  const handleVisitDateChange = (event, selectedDate) => {
    setShowVisitDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      // Create date object with only the date portion
      const dateOnly = new Date(format(selectedDate, 'yyyy-MM-dd'));
      setVisitDate(dateOnly);
    }
  };

  const handleNextVisitDateChange = (event, selectedDate) => {
    setShowNextVisitDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      // Create date object with only the date portion
      const dateOnly = new Date(format(selectedDate, 'yyyy-MM-dd'));
      setNextVisitDate(dateOnly);
    }
  };

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const data = await HealthService.getDoctorVisit(visitId);
        setFormData({
          doctor_name: data.doctor_name,
          clinic_location: data.clinic_location || '',
          reason_for_visit: data.reason_for_visit,
          diagnosis: data.diagnosis || '',
          prescription: data.prescription || '',
          notes: data.notes || '',
          follow_up_instructions: data.follow_up_instructions || '',
        });

        // Parse dates from API - ensure we only use the date portion
        const visitDateOnly = format(new Date(data.visit_date), 'yyyy-MM-dd');
        const parsedVisitDate = parseISO(visitDateOnly);
        
        let parsedNextVisitDate = null;
        if (data.next_visit_date) {
          const nextVisitDateOnly = format(new Date(data.next_visit_date), 'yyyy-MM-dd');
          parsedNextVisitDate = parseISO(nextVisitDateOnly);
        }

        setVisitDate(parsedVisitDate);
        setNextVisitDate(parsedNextVisitDate);
        setLoading(false);
      } catch (err) {
        setErrors({ submit: 'Failed to load doctor visit' });
        setLoading(false);
      }
    };
    fetchVisit();
  }, [visitId]);

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
    if (!formData.reason_for_visit.trim()) {
      newErrors.reason_for_visit = 'Reason for visit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const visitData = {
        ...formData,
        visit_date: formatForAPI(visitDate),
        next_visit_date: formatForAPI(nextVisitDate),
      };

      await HealthService.updateDoctorVisit(visitId, visitData);
      navigation.goBack();
    } catch (error) {
      setErrors({
        submit: 'Failed to update doctor visit. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text variant="titleLarge" style={styles.title}>
              Edit Doctor Visit
            </Text>
          </View>
          <LoadingSpinner />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.title}>
            Edit Doctor Visit
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              {errors.submit && (
                <ErrorMessage message={errors.submit} />
              )}

              <Button
                mode="outlined"
                onPress={() => setShowVisitDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                Visit Date: {formatDateTime(visitDate)}
              </Button>

              {showVisitDatePicker && (
                <DateTimePicker
                  value={visitDate}
                  mode="date"
                  display="default"
                  onChange={handleVisitDateChange}
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
                label="Reason for Visit"
                value={formData.reason_for_visit}
                onChangeText={(text) => handleInputChange('reason_for_visit', text)}
                style={styles.input}
                error={!!errors.reason_for_visit}
                multiline
              />
              <HelperText type="error" visible={!!errors.reason_for_visit}>
                {errors.reason_for_visit}
              </HelperText>

              <TextInput
                label="Diagnosis"
                value={formData.diagnosis}
                onChangeText={(text) => handleInputChange('diagnosis', text)}
                style={styles.input}
                multiline
              />

              <TextInput
                label="Prescription"
                value={formData.prescription}
                onChangeText={(text) => handleInputChange('prescription', text)}
                style={styles.input}
                multiline
              />

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                style={styles.input}
                multiline
              />

              <TextInput
                label="Follow-up Instructions"
                value={formData.follow_up_instructions}
                onChangeText={(text) => handleInputChange('follow_up_instructions', text)}
                style={styles.input}
                multiline
              />

              <Button
                mode="outlined"
                onPress={() => setShowNextVisitDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {nextVisitDate
                  ? `Next Visit: ${formatDateTime(nextVisitDate)}`
                  : 'Set Next Visit Date'}
              </Button>

              {showNextVisitDatePicker && (
                <DateTimePicker
                  value={nextVisitDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleNextVisitDateChange}
                  minimumDate={new Date()}
                />
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  loading={saving}
                  disabled={saving}
                >
                  Save Changes
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                  disabled={saving}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
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
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  dateButton: {
    marginVertical: 8,
    backgroundColor: 'white',
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

export default EditDoctorVisitScreen; 