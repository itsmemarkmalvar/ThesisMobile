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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTimezone } from '../context/TimezoneContext';
import { DateTimeService } from '../services/DateTimeService';

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
  const { timezone } = useTimezone();

  // Convert UTC to local time manually to ensure correct offset
  const convertToLocal = (utcString) => {
    try {
      const utcDate = new Date(utcString);
      // For Manila (UTC+8), add 8 hours
      const localDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
      
      // Get hours and minutes after +8 offset
      const hours = localDate.getUTCHours();
      const minutes = localDate.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      // Format the display time manually
      const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      const displayDate = localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      console.log('Manual timezone conversion:', {
        utc: utcString,
        local: {
          iso: localDate.toISOString(),
          display: `${displayDate}, ${displayTime}`,
          computed: {
            utcHours: localDate.getUTCHours(),
            displayHours,
            ampm
          }
        },
        timezone,
        offset: '+8 hours'
      });
      
      return localDate;
    } catch (error) {
      console.error('Error in manual conversion:', error);
      return null;
    }
  };

  const formatDateTime = (dateString) => {
    const localDate = convertToLocal(dateString);
    if (!localDate) return '';
    
    return {
      date: localDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: `${String(localDate.getUTCHours() % 12 || 12).padStart(2, '0')}:${String(localDate.getUTCMinutes()).padStart(2, '0')} ${localDate.getUTCHours() >= 12 ? 'PM' : 'AM'}`
    };
  };

  const fetchData = async (search = '') => {
    try {
      setError(null);
      console.log('Fetching health data...');
      const [appointmentsResponse, records, visits, symptoms] = await Promise.all([
        HealthService.getUpcomingAppointments(),
        HealthService.getHealthRecords(1, search),
        HealthService.getDoctorVisits(),
        HealthService.getSymptoms(null, null, null, 'active')
      ]);
      
      console.log('Raw appointments response:', appointmentsResponse);
      
      // Handle the appointments response consistently
      const appointmentData = Array.isArray(appointmentsResponse?.data) ? appointmentsResponse.data : [];
      
      console.log('Processed appointments:', appointmentData);
      console.log('Number of upcoming appointments:', appointmentData.length);
      
      setUpcomingAppointments(appointmentData);
      setRecentHealthRecords(records?.data || []);
      setRecentDoctorVisits(Array.isArray(visits) ? visits : []);
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

  // Add useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('HealthScreen focused - refreshing data');
      loadData();
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  const renderFeatureCard = (title, icon, onPress, count = null) => (
    <TouchableOpacity onPress={onPress} style={styles.featureCard} key={`feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <View style={styles.cardContainer}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Icon name={icon} size={32} color={theme.colors.primary} />
          </View>
          <Text variant="titleMedium" style={styles.cardTitle}>{title}</Text>
          {count !== null && (
            <View style={[styles.countContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Text variant="bodyMedium" style={[styles.cardCount, { color: theme.colors.primary }]}>
                {count}
              </Text>
              <Text variant="bodySmall" style={[styles.cardCountLabel, { color: theme.colors.primary }]}>
                {count === 1 ? 'item' : 'items'}
              </Text>
            </View>
          )}
        </View>
      </View>
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
                    {upcomingAppointments.map(appointment => {
                      const formattedTime = formatDateTime(appointment.appointment_date);
                      return (
                        <Card key={appointment.id} style={styles.listCard} mode="elevated">
                          <LinearGradient
                            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
                            style={styles.listCardGradient}
                          >
                            <Card.Content style={styles.listCardContent}>
                              <View style={styles.appointmentHeader}>
                                <View style={styles.dateTimeContainer}>
                                  <Text variant="titleMedium" style={styles.dateText}>
                                    {formattedTime.date}
                                  </Text>
                                  <Text variant="bodyMedium" style={styles.timeText}>
                                    {formattedTime.time}
                                  </Text>
                                  <Text variant="bodySmall" style={styles.timezoneText}>
                                    ({timezone})
                                  </Text>
                                </View>
                                <Icon name="calendar-clock" size={24} color={theme.colors.primary} />
                              </View>
                              <View style={styles.appointmentDetails}>
                                <Text variant="titleMedium" style={styles.doctorName}>
                                  {appointment.doctor_name || 'Doctor not specified'}
                                </Text>
                                <Text variant="bodyMedium" style={styles.purpose}>
                                  {appointment.purpose || 'No purpose specified'}
                                </Text>
                              </View>
                            </Card.Content>
                          </LinearGradient>
                        </Card>
                      );
                    })}
                    <Button
                      mode="text"
                      onPress={() => navigation.navigate('Appointments')}
                      style={styles.viewAllButton}
                      labelStyle={styles.viewAllButtonLabel}
                      icon="chevron-right"
                      contentStyle={styles.viewAllButtonContent}
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
                      <Card key={record.id} style={styles.listCard} mode="elevated">
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
                          style={styles.listCardGradient}
                        >
                          <Card.Content style={styles.listCardContent}>
                            <View style={styles.recordHeader}>
                              <View>
                                <Text variant="titleMedium" style={styles.recordTitle}>
                                  {record.title}
                                </Text>
                                <Text variant="bodyMedium" style={styles.recordType}>
                                  {record.type}
                                </Text>
                              </View>
                              <View style={[styles.recordDateContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                                <Icon name="calendar" size={16} color={theme.colors.primary} />
                                <Text variant="bodySmall" style={[styles.recordDate, { color: theme.colors.primary }]}>
                                  {format(new Date(record.record_date), 'MMM d, yyyy')}
                                </Text>
                              </View>
                            </View>
                          </Card.Content>
                        </LinearGradient>
                      </Card>
                    ))}
                    <Button
                      mode="text"
                      onPress={() => navigation.navigate('HealthRecords')}
                      style={styles.viewAllButton}
                      labelStyle={styles.viewAllButtonLabel}
                      icon="chevron-right"
                      contentStyle={styles.viewAllButtonContent}
                    >
                      View All Records
                    </Button>
                  </View>
                )}
              </>
            )}
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
    marginHorizontal: -8,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    margin: 8,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardCount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  cardCountLabel: {
    opacity: 0.8,
  },
  listCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listCardGradient: {
    borderRadius: 12,
  },
  listCardContent: {
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  appointmentDetails: {
    marginTop: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  purpose: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recordType: {
    fontSize: 14,
    color: '#4B5563',
  },
  recordDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordDate: {
    marginLeft: 4,
  },
  viewAllButton: {
    marginTop: 8,
  },
  viewAllButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButtonContent: {
    flexDirection: 'row-reverse',
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
  timezoneText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  }
});

export default HealthScreen; 