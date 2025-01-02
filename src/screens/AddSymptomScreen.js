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
  SegmentedButtons,
  Switch,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const AddSymptomScreen = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'mild',
    related_condition: '',
    notes: '',
  });

  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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

    if (!formData.name.trim()) {
      newErrors.name = 'Symptom name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.severity) {
      newErrors.severity = 'Severity level is required';
    }
    if (!isActive && !endDate) {
      newErrors.endDate = 'End date is required for resolved symptoms';
    }
    if (endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null; // Invalid date check
      return format(d, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = !isActive ? formatDateForAPI(endDate) : null;

      if (!formattedStartDate) {
        throw new Error('Invalid start date');
      }

      if (!isActive && !formattedEndDate) {
        throw new Error('Invalid end date');
      }

      await HealthService.createSymptom({
        ...formData,
        onset_date: formattedStartDate,
        resolved_date: formattedEndDate,
        // is_active is determined by resolved_date being null or not
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating symptom:', error);
      setErrors({
        submit: error.message || 'Failed to save symptom. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setEndDate(selectedDate);
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="titleMedium" style={styles.headerTitle}>
            Add Symptom
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {errors.submit && (
            <ErrorMessage message={errors.submit} />
          )}

          <TextInput
            label="Symptom Name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            style={styles.input}
            error={!!errors.name}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            style={styles.input}
            error={!!errors.description}
            multiline
            numberOfLines={3}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Severity Level
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.severityScroll}
          >
            <SegmentedButtons
              value={formData.severity}
              onValueChange={(value) => handleInputChange('severity', value)}
              buttons={SEVERITY_LEVELS}
              style={styles.segmentedButtons}
            />
          </ScrollView>

          <Button
            mode="outlined"
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            Start Date: {format(startDate, 'MMM d, yyyy')}
          </Button>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          <View style={styles.statusContainer}>
            <Text variant="titleMedium">Status</Text>
            <View style={styles.switchContainer}>
              <Text>Resolved</Text>
              <Switch
                value={isActive}
                onValueChange={(value) => {
                  setIsActive(value);
                  if (value) {
                    setEndDate(null);
                  }
                }}
              />
              <Text>Active</Text>
            </View>
          </View>

          {!isActive && (
            <>
              <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                End Date: {endDate ? format(endDate, 'MMM d, yyyy') : 'Select Date'}
              </Button>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                />
              )}

              {errors.endDate && (
                <HelperText type="error" visible={!!errors.endDate}>
                  {errors.endDate}
                </HelperText>
              )}
            </>
          )}

          <TextInput
            label="Related Condition (Optional)"
            value={formData.related_condition}
            onChangeText={(text) => handleInputChange('related_condition', text)}
            style={styles.input}
          />

          <TextInput
            label="Additional Notes (Optional)"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              Save Symptom
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
  header: {
    backgroundColor: 'white',
    elevation: 2,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
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
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  severityScroll: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginRight: 16,
  },
  dateButton: {
    marginVertical: 8,
  },
  statusContainer: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  submitButton: {
    padding: 8,
  },
});

export default AddSymptomScreen; 