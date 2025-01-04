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
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';

const AddDoctorVisitScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [visitDate, setVisitDate] = useState(new Date());
  const [nextVisitDate, setNextVisitDate] = useState(null);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showNextVisitDatePicker, setShowNextVisitDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    doctor_name: '',
    clinic_location: '',
    reason: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const navigation = useNavigation();
  const theme = useTheme();

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
          Add Doctor Visit
        </Text>
      </View>
    </View>
  );

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
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for visit is required';
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
      await HealthService.createDoctorVisit({
        ...formData,
        visit_date: visitDate,
        next_visit_date: nextVisitDate,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating doctor visit:', error);
      setErrors({
        submit: 'Failed to save doctor visit. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

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
              value={formData.reason}
              onChangeText={(text) => handleInputChange('reason', text)}
              style={styles.input}
              error={!!errors.reason}
              multiline
            />
            <HelperText type="error" visible={!!errors.reason}>
              {errors.reason}
            </HelperText>

            <TextInput
              label="Diagnosis"
              value={formData.diagnosis}
              onChangeText={(text) => handleInputChange('diagnosis', text)}
              style={styles.input}
              multiline
            />

            <TextInput
              label="Treatment"
              value={formData.treatment}
              onChangeText={(text) => handleInputChange('treatment', text)}
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

            <Button
              mode="outlined"
              onPress={() => setShowNextVisitDatePicker(true)}
              style={styles.dateButton}
            >
              Next Visit Date: {nextVisitDate ? format(nextVisitDate, 'MMM d, yyyy') : 'Not Scheduled'}
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
              >
                Save Visit
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

export default AddDoctorVisitScreen; 