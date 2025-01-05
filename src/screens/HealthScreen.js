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
import { LinearGradient } from 'expo-linear-gradient';
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
      const [appointmentsResponse, records, visits, symptoms] = await Promise.all([
        HealthService.getUpcomingAppointments(),
        HealthService.getHealthRecords(1, search),
        HealthService.getDoctorVisits(1, search),
        HealthService.getSymptoms(null, null, null, 'active')
      ]);
      
      console.log('Raw appointments response:', appointmentsResponse);
      
      // Handle the appointments response directly (not nested under data)
      setUpcomingAppointments(Array.isArray(appointmentsResponse) ? appointmentsResponse : []);
      setRecentHealthRecords(records?.data || []);
      setRecentDoctorVisits(visits?.data || []);
      setActiveSymptoms(symptoms?.data || []);

      console.log('Processed appointments:', Array.isArray(appointmentsResponse) ? appointmentsResponse : []);
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
                          <Text variant="bodyMedium">{appointment.doctor_name || 'Doctor not specified'}</Text>
                          <Text variant="bodySmall">{appointment.purpose || 'No purpose specified'}</Text>
                        </Card.Content>
                      </Card>
                    ))}
                    <Button
                      mode="text"
                      onPress={() => navigation.navigate('Appointments')}
                      style={styles.viewAllButton}
                      textColor="#4A90E2"
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
                      textColor="#4A90E2"
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
  },
  cardCount: {
    marginTop: 4,
    color: '#666',
  },
  listCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  viewAllButton: {
    marginTop: 8,
  },
  addButtonContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  addButton: {
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyStateMessage: {
    textAlign: 'center',
    color: '#666',
  },
  loaderContainer: {
    padding: 24,
    alignItems: 'center',
  },
});

export default HealthScreen; 