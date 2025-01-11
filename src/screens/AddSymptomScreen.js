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
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import { LinearGradient } from 'expo-linear-gradient';

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const AddSymptomScreen = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'mild',
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      // Ensure time is set to 8 AM Manila time
      d.setHours(8, 0, 0, 0);
      return format(d, 'yyyy-MM-dd HH:mm:ss');
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

      if (!formattedStartDate) {
        throw new Error('Invalid start date');
      }

      await HealthService.createSymptom({
        ...formData,
        onset_date: formattedStartDate,
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
    if (event.type === 'set' && selectedDate) {
      // Set time to 8 AM Manila time (which will be 00:00 UTC)
      selectedDate.setHours(8, 0, 0, 0);
      setStartDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
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
              Add Symptom
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
                contentStyle={styles.dateButtonContent}
                labelStyle={styles.dateButtonLabel}
                textColor="#1976D2"
              >
                Start Date: {format(startDate, 'MMM d, yyyy')}
              </Button>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                  maximumDate={new Date()}
                />
              )}

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                style={styles.input}
                multiline
                numberOfLines={3}
              />

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                labelStyle={styles.submitButtonLabel}
              >
                Save Symptom
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
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
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
  input: {
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  severityScroll: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  dateButton: {
    marginVertical: 8,
    borderColor: '#1976D2',
  },
  dateButtonContent: {
    height: 48,
  },
  dateButtonLabel: {
    fontSize: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: '#1976D2',
    height: 48,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 16,
  },
});

export default AddSymptomScreen; 