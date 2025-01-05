import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  useTheme,
  Chip,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

const RECORD_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'medication', label: 'Medication' },
  { value: 'allergy', label: 'Allergy' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'test_result', label: 'Test Result' },
  { value: 'other', label: 'Other' },
];

const HealthRecordsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const navigation = useNavigation();
  const theme = useTheme();

  const fetchRecords = async () => {
    try {
      setError(null);
      const response = await HealthService.getHealthRecords(selectedCategory || undefined);
      setRecords(response.data || []);
    } catch (err) {
      console.error('Error fetching health records:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view health records');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view these records');
      } else if (err.response?.status === 422) {
        setError('Invalid filter parameters. Please try again');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network');
      } else {
        setError('Unable to load health records. Please try again later');
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchRecords();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleAddRecord = () => {
    navigation.navigate('AddHealthRecord');
  };

  const handleViewRecord = (record) => {
    navigation.navigate('HealthRecordDetails', { recordId: record.id });
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Health Records
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.categoryContainer}>
            <Text variant="titleMedium" style={styles.filterTitle}>
              Filter by Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <SegmentedButtons
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                buttons={RECORD_CATEGORIES}
                style={styles.segmentedButtons}
                theme={{
                  colors: {
                    secondaryContainer: 'rgba(255, 255, 255, 0.9)',
                    onSecondaryContainer: '#333',
                  }
                }}
                density="medium"
              />
            </ScrollView>
          </View>

          {error && <ErrorMessage message={error} />}

          {records.length === 0 ? (
            <EmptyState
              icon="file-document"
              title="No Health Records"
              message="Add your first health record by tapping the + button below"
            />
          ) : (
            <View style={styles.content}>
              {records.map((record) => (
                <Card
                  key={record.id}
                  style={styles.card}
                  onPress={() => handleViewRecord(record)}
                >
                  <Card.Content>
                    <View style={styles.recordHeader}>
                      <Text variant="titleMedium" style={styles.title}>
                        {record.title}
                      </Text>
                      <Chip
                        style={[
                          styles.categoryChip,
                          { backgroundColor: `${getCategoryColor(record.category)}10` }
                        ]}
                        textStyle={{
                          color: getCategoryColor(record.category),
                          fontSize: 12,
                          lineHeight: 16,
                        }}
                      >
                        {RECORD_CATEGORIES.find(cat => cat.value === record.category)?.label || 'Other'}
                      </Chip>
                    </View>

                    <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                      {record.description}
                    </Text>

                    <View style={styles.recordDetails}>
                      <View style={styles.detailRow}>
                        <Text variant="bodySmall" style={styles.detailLabel}>
                          Date:
                        </Text>
                        <Text variant="bodySmall">
                          {format(new Date(record.record_date), 'MMM d, yyyy')}
                        </Text>
                      </View>

                      {record.doctor_name && (
                        <View style={styles.detailRow}>
                          <Text variant="bodySmall" style={styles.detailLabel}>
                            Doctor:
                          </Text>
                          <Text variant="bodySmall">
                            Dr. {record.doctor_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {record.has_attachments && (
                      <View style={styles.attachmentIndicator}>
                        <IconButton
                          icon="paperclip"
                          size={16}
                          style={styles.attachmentIcon}
                        />
                        <Text variant="bodySmall" style={styles.attachmentText}>
                          Has attachments
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>

        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddRecord}
          color="white"
        />
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
    color: '#333',
    marginLeft: 8,
  },
  categoryContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    marginBottom: 16,
  },
  filterTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#333',
    fontSize: 14,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  segmentedButtons: {
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  categoryChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  description: {
    marginBottom: 8,
    color: '#666',
    lineHeight: 20,
    fontSize: 14,
  },
  recordDetails: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attachmentIcon: {
    margin: 0,
  },
  attachmentText: {
    color: '#666',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 4,
  },
});

export default HealthRecordsScreen; 