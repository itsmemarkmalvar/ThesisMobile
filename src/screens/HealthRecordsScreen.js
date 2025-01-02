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
      <View style={styles.filters}>
        <View style={styles.filterHeader}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="titleMedium" style={styles.filterTitle}>
            Filter by Category
          </Text>
        </View>
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
          />
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
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
                        { backgroundColor: `${getCategoryColor(record.category)}20` }
                      ]}
                      textStyle={{
                        color: getCategoryColor(record.category),
                        fontSize: 12,
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
    </SafeAreaView>
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
  filters: {
    backgroundColor: 'white',
    elevation: 2,
    paddingBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  backButton: {
    marginLeft: -8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterScroll: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  segmentedButtons: {
    marginRight: 16,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  categoryChip: {
    height: 24,
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  recordDetails: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIcon: {
    margin: 0,
  },
  attachmentText: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HealthRecordsScreen; 