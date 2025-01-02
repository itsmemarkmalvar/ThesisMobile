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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const RECORD_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'medication', label: 'Medication' },
  { value: 'allergy', label: 'Allergy' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'test_result', label: 'Test Result' },
  { value: 'other', label: 'Other' },
];

const EditHealthRecordScreen = () => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [recordDate, setRecordDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    doctor_name: '',
    clinic_location: '',
    notes: '',
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
          doctor_name: data.doctor_name || '',
          clinic_location: data.clinic_location || '',
          notes: data.notes || '',
        });
        setRecordDate(new Date(data.record_date));
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const formDataToSend = new FormData();
      
      // Append record data
      formDataToSend.append('data', JSON.stringify({
        ...formData,
        record_date: recordDate.toISOString(),
      }));

      // Append new attachments
      attachments.forEach((attachment, index) => {
        const fileExtension = attachment.uri.split('.').pop();
        formDataToSend.append('attachments', {
          uri: attachment.uri,
          name: `attachment_${index}.${fileExtension}`,
          type: `image/${fileExtension}`,
        });
      });

      await HealthService.updateHealthRecord(recordId, formDataToSend);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating health record:', error);
      setErrors({
        submit: 'Failed to update health record. Please try again.',
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
            Edit Health Record
          </Text>

          {errors.submit && (
            <ErrorMessage message={errors.submit} />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            Date: {format(recordDate, 'MMM d, yyyy')}
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

          <TextInput
            label="Title"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            style={styles.input}
            error={!!errors.title}
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
            error={!!errors.description}
            multiline
            numberOfLines={3}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>

          <TextInput
            label="Doctor Name"
            value={formData.doctor_name}
            onChangeText={(text) => handleInputChange('doctor_name', text)}
            style={styles.input}
          />

          <TextInput
            label="Clinic Location"
            value={formData.clinic_location}
            onChangeText={(text) => handleInputChange('clinic_location', text)}
            style={styles.input}
          />

          <TextInput
            label="Additional Notes"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <View style={styles.attachmentsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Attachments
            </Text>
            
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image-plus"
              style={styles.attachButton}
            >
              Add Image
            </Button>

            {existingAttachments.length > 0 && (
              <>
                <Text variant="titleSmall" style={styles.subsectionTitle}>
                  Existing Attachments
                </Text>
                <View style={styles.attachmentList}>
                  {existingAttachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <Image
                        source={{ uri: attachment.url }}
                        style={styles.attachmentThumbnail}
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        style={styles.removeButton}
                        onPress={() => removeExistingAttachment(attachment.id)}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}

            {attachments.length > 0 && (
              <>
                <Text variant="titleSmall" style={styles.subsectionTitle}>
                  New Attachments
                </Text>
                <View style={styles.attachmentList}>
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <Image
                        source={{ uri: attachment.uri }}
                        style={styles.attachmentThumbnail}
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        style={styles.removeButton}
                        onPress={() => removeAttachment(index)}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              Update Record
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
  dateButton: {
    marginVertical: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  subsectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    color: '#666',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginRight: 16,
  },
  attachmentsSection: {
    marginTop: 16,
  },
  attachButton: {
    marginBottom: 16,
  },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
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

export default EditHealthRecordScreen; 