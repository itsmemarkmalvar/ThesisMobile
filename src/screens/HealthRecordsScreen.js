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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Create date object and adjust for Manila timezone (+8)
    const date = new Date(dateString);
    const manilaDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return format(manilaDate, 'MMM d, yyyy');
  };

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
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.recordHeader}>
                      <View style={styles.titleContainer}>
                        <Text variant="titleMedium" style={styles.title}>
                          {record.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.date}>
                          {formatDate(record.record_date)}
                        </Text>
                      </View>
                      <Chip
                        style={[
                          styles.categoryChip,
                          { backgroundColor: `${getCategoryColor(record.category)}20` }
                        ]}
                        textStyle={{
                          color: getCategoryColor(record.category),
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {RECORD_CATEGORIES.find(cat => cat.value === record.category)?.label || 'Other'}
                      </Chip>
                    </View>

                    <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
                      {record.description}
                    </Text>

                    <View style={styles.recordFooter}>
                      {record.severity && (
                        <Chip
                          style={[
                            styles.severityChip,
                            { 
                              backgroundColor: record.severity === 'severe' 
                                ? '#FFE5E5' 
                                : record.severity === 'moderate'
                                ? '#FFF4E5'
                                : '#E8F5E9'
                            }
                          ]}
                          textStyle={{
                            color: record.severity === 'severe' 
                              ? '#D32F2F' 
                              : record.severity === 'moderate'
                              ? '#F57C00'
                              : '#2E7D32',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                        </Chip>
                      )}
                      
                      {record.is_ongoing && (
                        <Chip
                          style={styles.ongoingChip}
                          textStyle={{
                            color: '#1976D2',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          Ongoing
                        </Chip>
                      )}

                      {record.has_attachments && (
                        <View style={styles.attachmentIndicator}>
                          <IconButton
                            icon="paperclip"
                            size={16}
                            iconColor="#666"
                            style={styles.attachmentIcon}
                          />
                          <Text variant="bodySmall" style={styles.attachmentText}>
                            Has attachments
                          </Text>
                        </View>
                      )}
                    </View>
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
    marginBottom: 16,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
  },
  cardContent: {
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  categoryChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  description: {
    color: '#555',
    lineHeight: 20,
    fontSize: 14,
    marginBottom: 12,
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  severityChip: {
    height: 28,
    borderRadius: 14,
    marginVertical: 2,
  },
  ongoingChip: {
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    marginVertical: 2,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginVertical: 2,
  },
  attachmentIcon: {
    margin: 0,
    width: 20,
    height: 20,
  },
  attachmentText: {
    color: '#666',
    fontSize: 12,
    marginLeft: -4,
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