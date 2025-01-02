import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Text, Card, Button, useTheme, Portal, Dialog, Searchbar, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EmptyState = ({ icon, title, message }) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={48} color="#757575" />
    <Text variant="titleMedium" style={styles.emptyStateTitle}>{title}</Text>
    <Text variant="bodyMedium" style={styles.emptyStateMessage}>{message}</Text>
  </View>
);

const SkeletonLoader = () => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="small" color="#666" />
  </View>
);

const HealthScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentHealthRecords, setRecentHealthRecords] = useState([]);
  const [recentDoctorVisits, setRecentDoctorVisits] = useState([]);
  const [activeSymptoms, setActiveSymptoms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [retryVisible, setRetryVisible] = useState(false);
  
  const navigation = useNavigation();
  const theme = useTheme();

  const fetchData = async (search = '') => {
    try {
      setError(null);
      const [appointments, records, visits, symptoms] = await Promise.all([
        HealthService.getUpcomingAppointments(1, search),
        HealthService.getHealthRecords(1, search),
        HealthService.getDoctorVisits(1, search),
        HealthService.getSymptoms(null, null, null, 'active')
      ]);
      
      setUpcomingAppointments(appointments?.data || []);
      setRecentHealthRecords(records?.data || []);
      setRecentDoctorVisits(visits?.data || []);
      setActiveSymptoms(symptoms?.data || []);
    } catch (err) {
      setError('Failed to load health data');
      console.error('Error fetching health data:', err);
      setRetryVisible(true);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchData(searchQuery);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(searchQuery);
    setRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    await fetchData(query);
  };

  const handleRetry = () => {
    setRetryVisible(false);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderFeatureCard = (title, icon, onPress, count = null) => (
    <TouchableOpacity onPress={onPress} style={styles.featureCard} key={`feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Icon name={icon} size={32} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.cardTitle}>{title}</Text>
          {count !== null && (
            <Text variant="bodySmall" style={styles.cardCount}>
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Health Tracking
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && <ErrorMessage message={error} />}

        <View style={styles.content}>
          {loading && !refreshing ? (
            <SkeletonLoader />
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.grid}>
                  {[
                    {
                      title: 'Doctor Visits',
                      icon: 'doctor',
                      onPress: () => navigation.navigate('DoctorVisits'),
                      count: recentDoctorVisits.length
                    },
                    {
                      title: 'Health Records',
                      icon: 'clipboard-text',
                      onPress: () => navigation.navigate('HealthRecords'),
                      count: recentHealthRecords.length
                    },
                    {
                      title: 'Appointments',
                      icon: 'calendar-clock',
                      onPress: () => navigation.navigate('Appointments'),
                      count: upcomingAppointments.length
                    },
                    {
                      title: 'Symptoms',
                      icon: 'medical-bag',
                      onPress: () => navigation.navigate('Symptoms'),
                      count: activeSymptoms.length
                    }
                  ].map(item => renderFeatureCard(item.title, item.icon, item.onPress, item.count))}
                </View>
              </View>

              {upcomingAppointments.length === 0 && !loading && (
                <EmptyState
                  icon="calendar-blank"
                  title="No Upcoming Appointments"
                  message="You don't have any upcoming appointments scheduled."
                />
              )}

              {upcomingAppointments.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>Upcoming Appointments</Text>
                  {upcomingAppointments.map(appointment => (
                    <Card key={appointment.id} style={styles.listCard}>
                      <Card.Content>
                        <Text variant="titleMedium">
                          {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')}
                        </Text>
                        <Text variant="bodyMedium">Dr. {appointment.doctor_name}</Text>
                        <Text variant="bodySmall">{appointment.purpose}</Text>
                      </Card.Content>
                    </Card>
                  ))}
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Appointments')}
                    style={styles.viewAllButton}
                  >
                    View All Appointments
                  </Button>
                </View>
              )}

              {recentHealthRecords.length === 0 && !loading && (
                <EmptyState
                  icon="clipboard-text-outline"
                  title="No Health Records"
                  message="You haven't added any health records yet."
                />
              )}

              {recentHealthRecords.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>Recent Health Records</Text>
                  {recentHealthRecords.map(record => (
                    <Card key={record.id} style={styles.listCard}>
                      <Card.Content>
                        <Text variant="titleMedium">{record.title}</Text>
                        <Text variant="bodyMedium">{record.type}</Text>
                        <Text variant="bodySmall">
                          {format(new Date(record.record_date), 'MMM d, yyyy')}
                        </Text>
                      </Card.Content>
                    </Card>
                  ))}
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('HealthRecords')}
                    style={styles.viewAllButton}
                  >
                    View All Records
                  </Button>
                </View>
              )}
            </>
          )}

          <View style={styles.addButtonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddHealthRecord')}
              style={styles.addButton}
              icon="plus"
            >
              Add Health Record
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    elevation: 2,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    marginLeft: 4,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  featureCard: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  cardCount: {
    marginTop: 4,
    color: '#757575',
  },
  listCard: {
    marginBottom: 12,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyStateMessage: {
    textAlign: 'center',
    color: '#757575',
  },
  errorMessage: {
    margin: 16,
  },
  loaderContainer: {
    padding: 8,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  viewAllButton: {
    marginTop: 8,
  }
});

export default HealthScreen; 