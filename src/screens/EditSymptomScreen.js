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
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const EditSymptomScreen = () => {
  const [loading, setLoading] = useState(true);
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
  const route = useRoute();
  const theme = useTheme();
  const { symptomId } = route.params;

  useEffect(() => {
    const fetchSymptom = async () => {
      try {
        const data = await HealthService.getSymptom(symptomId);
        console.log('Full API Response:', data);
        
        // Check if response exists and has required fields
        if (!data || !data.name || !data.severity) {
          console.log('Missing fields:', {
            hasResponse: !!data,
            hasName: data?.name,
            hasSeverity: data?.severity
          });
          throw new Error('Missing required symptom data');
        }
        
        setFormData({
          name: data.name,
          description: data.description || '',
          severity: data.severity,
          related_condition: data.related_conditions || '',  // Note: field name is related_conditions
          notes: data.notes || '',
        });

        // Safely handle start date
        let parsedStartDate = null;
        try {
          if (data.onset_date) {
            parsedStartDate = new Date(data.onset_date);
            if (isNaN(parsedStartDate.getTime())) {
              parsedStartDate = new Date();
            }
          } else {
            parsedStartDate = new Date();
          }
        } catch (error) {
          console.error('Error parsing start date:', error);
          parsedStartDate = new Date();
        }
        setStartDate(parsedStartDate);

        // Safely handle end date
        let parsedEndDate = null;
        try {
          if (data.resolved_date) {
            parsedEndDate = new Date(data.resolved_date);
            if (isNaN(parsedEndDate.getTime())) {
              parsedEndDate = null;
            }
          }
        } catch (error) {
          console.error('Error parsing end date:', error);
          parsedEndDate = null;
        }
        setEndDate(parsedEndDate);

        // Since there's no is_active field, determine it based on resolved_date
        setIsActive(!data.resolved_date);
      } catch (error) {
        console.error('Error fetching symptom:', error);
        setErrors({
          submit: error.message || 'Failed to load symptom details. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSymptom();
  }, [symptomId]);

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await HealthService.updateSymptom(symptomId, {
        ...formData,
        onset_date: startDate.toISOString().split('T')[0],
        resolved_date: !isActive && endDate ? endDate.toISOString().split('T')[0] : null,
        is_active: isActive,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating symptom:', error);
      setErrors({
        submit: 'Failed to update symptom. Please try again.',
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
            Edit Symptom
          </Text>

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
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
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
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
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
              Update Symptom
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
    gap: 12,
  },
  submitButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
});

export default EditSymptomScreen; 