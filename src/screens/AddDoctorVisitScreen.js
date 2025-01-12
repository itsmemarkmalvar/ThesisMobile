import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
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
import { format, parseISO } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import { LinearGradient } from 'expo-linear-gradient';

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
    reason_for_visit: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const navigation = useNavigation();
  const theme = useTheme();

  // Format date for display
  const formatDate = (date) => {
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
    if (!formData.reason_for_visit.trim()) {
      newErrors.reason_for_visit = 'Reason for visit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const visitData = {
        ...formData,
        visit_date: formatForAPI(visitDate),
        next_visit_date: formatForAPI(nextVisitDate),
      };

      await HealthService.createDoctorVisit(visitData);
      navigation.goBack();
    } catch (error) {
      setErrors({
        submit: 'Failed to save doctor visit. Please try again.'
      });
    } finally {
      setLoading(false);
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
          {renderHeader()}
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
                style={[styles.dateButton, { borderColor: '#4A90E2' }]}
                labelStyle={{ color: '#4A90E2' }}
                icon="calendar"
              >
                Visit Date: {formatDate(visitDate)}
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
                mode="outlined"
                error={!!errors.doctor_name}
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />
              <HelperText type="error" visible={!!errors.doctor_name}>
                {errors.doctor_name}
              </HelperText>

              <TextInput
                label="Clinic Location"
                value={formData.clinic_location}
                onChangeText={(text) => handleInputChange('clinic_location', text)}
                style={styles.input}
                mode="outlined"
                textColor="#333333"
                placeholderTextColor="#666666"
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />

              <TextInput
                label="Reason for Visit"
                value={formData.reason_for_visit}
                onChangeText={(text) => handleInputChange('reason_for_visit', text)}
                style={styles.input}
                mode="outlined"
                error={!!errors.reason_for_visit}
                multiline
                numberOfLines={3}
                textColor="#333333"
                placeholderTextColor="#666666"
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />
              <HelperText type="error" visible={!!errors.reason_for_visit}>
                {errors.reason_for_visit}
              </HelperText>

              <TextInput
                label="Diagnosis"
                value={formData.diagnosis}
                onChangeText={(text) => handleInputChange('diagnosis', text)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                textColor="#333333"
                placeholderTextColor="#666666"
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />

              <TextInput
                label="Treatment"
                value={formData.treatment}
                onChangeText={(text) => handleInputChange('treatment', text)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                textColor="#333333"
                placeholderTextColor="#666666"
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                textColor="#333333"
                placeholderTextColor="#666666"
                theme={{
                  colors: {
                    onSurfaceVariant: '#000000',
                    primary: theme.colors.primary,
                    background: 'transparent',
                    surface: 'transparent',
                  },
                }}
              />

              <Button
                mode="outlined"
                onPress={() => setShowNextVisitDatePicker(true)}
                style={[styles.dateButton, { borderColor: '#4A90E2' }]}
                labelStyle={{ color: '#4A90E2' }}
                icon="calendar"
              >
                Next Visit Date: {nextVisitDate ? formatDate(nextVisitDate) : 'Not Scheduled'}
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
                >
                  Save Visit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={[styles.cancelButton, { borderColor: theme.colors.primary }]}
                  labelStyle={{ color: theme.colors.primary }}
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
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
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
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  dateButton: {
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
});

export default AddDoctorVisitScreen; 