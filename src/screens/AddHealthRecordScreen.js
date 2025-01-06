import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  SegmentedButtons,
  IconButton,
  Checkbox,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';

const RECORD_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'medication', label: 'Medication' },
  { value: 'allergy', label: 'Allergy' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'test_result', label: 'Test Result' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const AddHealthRecordScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recordDate, setRecordDate] = useState(new Date());
  const [resolvedDate, setResolvedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showResolvedDatePicker, setShowResolvedDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    notes: '',
    is_ongoing: false,
    severity: null,
    treatment: '',
    resolved_at: null,
  });

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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.severity && !['mild', 'moderate', 'severe'].includes(formData.severity)) {
      newErrors.severity = 'Invalid severity level';
    }

    if (!formData.is_ongoing && formData.resolved_at) {
      const resolvedDate = new Date(formData.resolved_at);
      const recordDateTime = new Date(recordDate);
      if (resolvedDate < recordDateTime) {
        newErrors.resolved_at = 'Resolved date must be after or equal to record date';
      }
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
      await HealthService.createHealthRecord({
        ...formData,
        record_date: format(recordDate, 'yyyy-MM-dd HH:mm:ss')
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating health record:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          submit: 'Failed to save health record. Please try again.',
        });
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Add Health Record
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <TextInput
              label="Title"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              error={!!errors.title}
              contentStyle={styles.inputContent}
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title}
            </HelperText>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <SegmentedButtons
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                buttons={RECORD_CATEGORIES}
                style={styles.segmentedButtons}
              />
            </ScrollView>

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              error={!!errors.description}
              multiline
              numberOfLines={3}
              contentStyle={[styles.inputContent, styles.textArea]}
            />
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Severity
            </Text>
            <SegmentedButtons
              value={formData.severity}
              onValueChange={(value) => handleInputChange('severity', value)}
              buttons={SEVERITY_OPTIONS}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Treatment"
              value={formData.treatment}
              onChangeText={(text) => handleInputChange('treatment', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              multiline
              numberOfLines={2}
              contentStyle={[styles.inputContent, styles.textArea]}
            />

            <TextInput
              label="Additional Notes"
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              multiline
              numberOfLines={3}
              contentStyle={[styles.inputContent, styles.textArea]}
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
              icon="calendar"
            >
              Record Date: {format(recordDate, 'MMM d, yyyy')}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={recordDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setRecordDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.checkboxContainer}>
              <Checkbox.Android
                status={formData.is_ongoing ? 'checked' : 'unchecked'}
                onPress={() => handleInputChange('is_ongoing', !formData.is_ongoing)}
              />
              <Text>Is Ongoing</Text>
            </View>

            {!formData.is_ongoing && (
              <>
                <Button
                  mode="outlined"
                  onPress={() => setShowResolvedDatePicker(true)}
                  style={styles.dateButton}
                  labelStyle={styles.dateButtonLabel}
                  icon="calendar"
                >
                  Resolved Date: {resolvedDate ? format(resolvedDate, 'MMM d, yyyy') : 'Not Set'}
                </Button>

                {showResolvedDatePicker && (
                  <DateTimePicker
                    value={resolvedDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={recordDate}
                    onChange={(event, selectedDate) => {
                      setShowResolvedDatePicker(false);
                      if (selectedDate) {
                        setResolvedDate(selectedDate);
                        handleInputChange('resolved_at', format(selectedDate, 'yyyy-MM-dd HH:mm:ss'));
                      }
                    }}
                  />
                )}
              </>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                Save Record
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.cancelButton]}
                labelStyle={styles.dateButtonLabel}
                buttonColor="rgba(255, 255, 255, 0.9)"
                textColor="#4A90E2"
              >
                Cancel
              </Button>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  inputContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginRight: 16,
  },
  dateButton: {
    marginVertical: 8,
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dateButtonLabel: {
    color: '#4A90E2',
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
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default AddHealthRecordScreen; 