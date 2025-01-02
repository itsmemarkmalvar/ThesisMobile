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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!record) {
    return <ErrorMessage message="Health record not found" />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall" style={styles.title}>
          Health Record Details
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={handleEdit} title="Edit" />
          <Menu.Item onPress={handleDelete} title="Delete" />
        </Menu>
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
              {format(new Date(record.record_date), 'MMM d, yyyy')}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="labelLarge">Description</Text>
            <Text variant="bodyLarge" style={styles.sectionContent}>
              {record.description}
            </Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
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
  },
  button: {
    padding: 8,
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
});

export default HealthRecordDetailsScreen; 