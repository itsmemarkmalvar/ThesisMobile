import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const EditHealthRecordScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [recordDate, setRecordDate] = useState(new Date());
  const [resolvedDate, setResolvedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showResolvedDatePicker, setShowResolvedDatePicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    severity: null,
    treatment: '',
    notes: '',
    is_ongoing: false,
    resolved_at: null,
  });

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { recordId } = route.params;

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await HealthService.getHealthRecord(recordId);
        setFormData({
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity || null,
          treatment: data.treatment || '',
          notes: data.notes || '',
          is_ongoing: data.is_ongoing || false,
          resolved_at: data.resolved_at || null,
        });
        setRecordDate(new Date(data.record_date));
        if (data.resolved_at) {
          setResolvedDate(new Date(data.resolved_at));
        }
        setExistingAttachments(data.attachments || []);
      } catch (error) {
        console.error('Error fetching health record:', error);
        setErrors({
          submit: 'Failed to load health record details. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);

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

    // Handle is_ongoing toggle
    if (name === 'is_ongoing' && value === true) {
      setResolvedDate(null);
      setFormData(prev => ({
        ...prev,
        resolved_at: null,
      }));
      // Clear any resolved_at related errors
      setErrors(prev => ({
        ...prev,
        resolved_at: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.severity) {
      errors.severity = 'Severity is required';
    }

    if (!recordDate) {
      errors.record_date = 'Record date is required';
    }

    // Check if resolved date is the same as record date
    if (!formData.is_ongoing && resolvedDate) {
      const recordDateOnly = new Date(recordDate);
      recordDateOnly.setHours(0, 0, 0, 0);
      
      const resolvedDateOnly = new Date(resolvedDate);
      resolvedDateOnly.setHours(0, 0, 0, 0);

      if (recordDateOnly.getTime() === resolvedDateOnly.getTime()) {
        errors.resolved_at = 'Resolved date cannot be the same as record date';
      } else if (resolvedDateOnly < recordDateOnly) {
        errors.resolved_at = 'Resolved date must be after record date';
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachments(prev => [...prev, result.assets[0]]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId) => {
    try {
      await HealthService.deleteHealthRecordAttachment(recordId, attachmentId);
      setExistingAttachments(prev => 
        prev.filter(attachment => attachment.id !== attachmentId)
      );
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create a new date object at 8 AM Manila time to ensure it stays on the same day in UTC
      const recordDateTime = new Date(recordDate);
      recordDateTime.setHours(8, 0, 0, 0);

      let resolvedDateTime = null;
      if (!formData.is_ongoing && resolvedDate) {
        resolvedDateTime = new Date(resolvedDate);
        resolvedDateTime.setHours(8, 0, 0, 0);
      }

      const formDataToSend = {
        ...formData,
        record_date: format(recordDateTime, 'yyyy-MM-dd HH:mm:ss'),
        resolved_at: formData.is_ongoing ? null : 
          (resolvedDateTime ? format(resolvedDateTime, 'yyyy-MM-dd HH:mm:ss') : null)
      };

      await HealthService.updateHealthRecord(recordId, formDataToSend);

      // Handle attachments if any were added
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((attachment, index) => {
          const fileExtension = attachment.uri.split('.').pop();
          formData.append('attachments[]', {
            uri: attachment.uri,
            name: `attachment_${index + 1}.${fileExtension}`,
            type: `image/${fileExtension}`,
          });
        });

        await HealthService.uploadHealthRecordAttachments(recordId, formData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error updating health record:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          submit: 'Failed to update health record. Please try again.',
        });
      }
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'MMM d, yyyy');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Edit Health Record
            </Text>
          </View>

          {errors.submit && <ErrorMessage message={errors.submit} />}

          <View style={styles.content}>
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
                  if (event.type === 'set' && selectedDate) {
                    // Set time to 8 AM Manila time (which will be 00:00 UTC)
                    selectedDate.setHours(8, 0, 0, 0);
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
                      if (event.type === 'set' && selectedDate) {
                        // Set time to 8 AM Manila time (which will be 00:00 UTC)
                        selectedDate.setHours(8, 0, 0, 0);
                        setResolvedDate(selectedDate);
                        handleInputChange('resolved_at', format(selectedDate, 'yyyy-MM-dd'));
                      }
                    }}
                  />
                )}
              </>
            )}

            <View style={styles.buttonContainer}>
              {errors.submit && (
                <Text style={styles.errorText}>{errors.submit}</Text>
              )}
              {errors.resolved_at && (
                <Text style={[styles.errorText, { marginBottom: 10 }]}>{errors.resolved_at}</Text>
              )}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Update Record
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.button, styles.cancelButton]}
                textColor="#4A90E2"
                icon="close"
              >
                Cancel
              </Button>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 48,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    marginLeft: -8,
    marginRight: 8,
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
    marginBottom: 16,
  },
  dateButton: {
    marginVertical: 8,
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dateButtonLabel: {
    color: '#4A90E2',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
    paddingBottom: 32,
  },
  button: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default EditHealthRecordScreen; 