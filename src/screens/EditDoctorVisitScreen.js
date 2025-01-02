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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EditDoctorVisitScreen = () => {
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
        setVisitDate(new Date(data.visit_date));
        setNextVisitDate(data.next_visit_date ? new Date(data.next_visit_date) : null);
        setLoading(false);
      } catch (err) {
        setErrors({ submit: 'Failed to load doctor visit' });
        console.error('Error fetching doctor visit:', err);
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
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await HealthService.updateDoctorVisit(visitId, {
        ...formData,
        visit_date: visitDate,
        next_visit_date: nextVisitDate,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating doctor visit:', error);
      setErrors({
        submit: 'Failed to update doctor visit. Please try again.',
      });
      setSaving(false);
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
            Edit Doctor Visit
          </Text>

          {errors.submit && (
            <ErrorMessage message={errors.submit} />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowVisitDatePicker(true)}
            style={styles.dateButton}
          >
            Visit Date: {format(visitDate, 'MMM d, yyyy')}
          </Button>

          {showVisitDatePicker && (
            <DateTimePicker
              value={visitDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowVisitDatePicker(false);
                if (selectedDate) {
                  setVisitDate(selectedDate);
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
          >
            {nextVisitDate
              ? `Next Visit: ${format(nextVisitDate, 'MMM d, yyyy')}`
              : 'Set Next Visit Date'}
          </Button>

          {showNextVisitDatePicker && (
            <DateTimePicker
              value={nextVisitDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowNextVisitDatePicker(false);
                if (selectedDate) {
                  setNextVisitDate(selectedDate);
                }
              }}
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