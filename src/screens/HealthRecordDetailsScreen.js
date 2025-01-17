import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Divider,
  IconButton,
  Menu,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
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

const HealthRecordDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { recordId } = route.params;

  const fetchRecord = async () => {
    try {
      setError(null);
      const data = await HealthService.getHealthRecord(recordId);
      setRecord(data);
    } catch (err) {
      setError('Failed to load health record details');
      console.error('Error fetching health record:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchRecord();
      setLoading(false);
    };
    loadData();
  }, [recordId]);

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate('EditHealthRecord', { recordId });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Health Record',
      'Are you sure you want to delete this health record? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await HealthService.deleteHealthRecord(recordId);
              navigation.goBack();
            } catch (err) {
              setError('Failed to delete health record');
              console.error('Error deleting health record:', err);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'general':
        return '#2196F3';
      case 'vaccination':
        return '#4CAF50';
      case 'medication':
        return '#FF9800';
      case 'allergy':
        return '#F44336';
      case 'surgery':
        return '#9C27B0';
      case 'test_result':
        return '#00BCD4';
      default:
        return theme.colors.primary;
    }
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild':
        return '#4CAF5020';
      case 'moderate':
        return '#FFA50020';
      case 'severe':
        return '#F4433620';
      default:
        return '#E0E0E020';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Create date object and adjust for Manila timezone (+8)
    const date = new Date(dateString);
    const manilaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return format(manilaDate, 'MMM d, yyyy');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!record) {
    return <ErrorMessage message="Health record not found" />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <View style={styles.titleContainer}>
              <Text variant="headlineSmall" style={styles.title}>
                Health Record Details
              </Text>
            </View>
          </View>

          {error && <ErrorMessage message={error} />}

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.titleSection}>
                <Text variant="titleLarge" style={styles.recordTitle}>
                  {record.title}
                </Text>
                <Chip
                  style={[
                    styles.categoryChip,
                    { backgroundColor: `${getCategoryColor(record.category)}20` }
                  ]}
                  textStyle={{
                    color: getCategoryColor(record.category),
                  }}
                >
                  {RECORD_CATEGORIES.find(cat => cat.value === record.category)?.label || 'Other'}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="labelLarge">Date</Text>
                <Text variant="bodyLarge" style={styles.sectionContent}>
                  {formatDate(record.record_date)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="labelLarge">Description</Text>
                <Text variant="bodyLarge" style={styles.sectionContent}>
                  {record.description}
                </Text>
              </View>

              {record.severity && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Severity</Text>
                    <Chip
                      style={[
                        styles.severityChip,
                        { backgroundColor: getSeverityColor(record.severity) }
                      ]}
                    >
                      {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                    </Chip>
                  </View>
                </>
              )}

              {record.treatment && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Treatment</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {record.treatment}
                    </Text>
                  </View>
                </>
              )}

              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="labelLarge">Status</Text>
                <View style={styles.statusContainer}>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: record.is_ongoing ? '#FFA50020' : '#4CAF5020' }
                    ]}
                    textStyle={{
                      color: record.is_ongoing ? '#FFA500' : '#4CAF50'
                    }}
                  >
                    {record.is_ongoing ? 'Ongoing' : 'Resolved'}
                  </Chip>
                  {!record.is_ongoing && record.resolved_at && (
                    <Text variant="bodyMedium" style={styles.resolvedDate}>
                      Resolved on {formatDate(record.resolved_at)}
                    </Text>
                  )}
                </View>
              </View>

              {record.doctor_name && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Doctor</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      Dr. {record.doctor_name}
                    </Text>
                  </View>
                </>
              )}

              {record.clinic_location && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Location</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {record.clinic_location}
                    </Text>
                  </View>
                </>
              )}

              {record.notes && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Additional Notes</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {record.notes}
                    </Text>
                  </View>
                </>
              )}

              {record.attachments && record.attachments.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge" style={styles.attachmentsTitle}>
                      Attachments
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.attachmentsScroll}
                    >
                      {record.attachments.map((attachment, index) => (
                        <View key={index} style={styles.attachmentContainer}>
                          <Image
                            source={{ uri: attachment.url }}
                            style={styles.attachmentImage}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={[styles.button, styles.editButton]}
              icon="pencil"
            >
              Edit Record
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              style={[styles.button, styles.deleteButton]}
              buttonColor="#FF5252"
              icon="delete"
            >
              Delete Record
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Back to List
            </Button>
          </View>

          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <View style={styles.imagePreviewContent}>
                <IconButton
                  icon="close"
                  size={24}
                  style={styles.closeButton}
                  onPress={() => setSelectedImage(null)}
                />
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        </ScrollView>
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
    paddingVertical: 8,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 48,
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordTitle: {
    flex: 1,
    marginRight: 12,
    fontWeight: 'bold',
  },
  categoryChip: {
    height: 32,
  },
  section: {
    paddingVertical: 8,
  },
  sectionContent: {
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  attachmentsTitle: {
    marginBottom: 12,
  },
  attachmentsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  attachmentContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  button: {
    padding: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  imagePreviewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  previewImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  severityChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusChip: {
    marginRight: 12,
  },
  resolvedDate: {
    color: '#666',
  },
  backButton: {
    marginRight: 12,
  },
});

export default HealthRecordDetailsScreen; 