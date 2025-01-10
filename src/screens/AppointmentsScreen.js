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
  SegmentedButtons,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDisplayDateTime } from '../utils/dateUtils';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const formatAppointmentDate = (dateString) => {
  console.log('Formatting appointment date:', dateString);
  const formatted = formatDisplayDateTime(dateString);
  console.log('Formatted result:', formatted);
  return formatted || 'Invalid Date';
};

const AppointmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const navigation = useNavigation();
  const theme = useTheme();

  const fetchAppointments = async () => {
    try {
      setError(null);
      console.log('Fetching appointments with status filter:', selectedStatus || 'all');
      const response = await HealthService.getAppointments(
        null,
        null,
        selectedStatus || undefined
      );
      
      // Handle the appointments response consistently
      const appointmentData = Array.isArray(response?.data) ? response.data : [];
      
      console.log('Total appointments found:', appointmentData.length);
      console.log('Appointments by status:');
      const statusCounts = appointmentData.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});
      console.log(statusCounts);
      
      // Log each appointment's details
      appointmentData.forEach((apt, idx) => {
        console.log(`Appointment ${idx + 1}:`, {
          id: apt.id,
          date: apt.appointment_date,
          formattedDate: formatAppointmentDate(apt.appointment_date),
          status: apt.status,
          title: apt.title,
          doctor: apt.doctor_name,
          location: apt.location
        });
      });
      
      setAppointments(appointmentData);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error fetching appointments:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchAppointments();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('AppointmentsScreen focused - refreshing data');
      loadData();
      return () => {
        // Optional cleanup
      };
    }, [selectedStatus])
  );

  const handleAddAppointment = () => {
    navigation.navigate('AddAppointment');
  };

  const handleViewAppointment = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointmentId: appointment.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'rescheduled':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const renderAppointmentCard = (appointment) => {
    const formattedDate = formatAppointmentDate(appointment.appointment_date);
    console.log('Rendering appointment:', {
      id: appointment.id,
      rawDate: appointment.appointment_date,
      formattedDate,
      status: appointment.status
    });
    
    return (
      <Card key={appointment.id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium">{appointment.title}</Text>
            <Chip mode="outlined" style={getStatusStyle(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Chip>
          </View>
          <View style={styles.cardDetails}>
            <Text variant="bodyMedium">Date & Time: {formattedDate}</Text>
            {appointment.doctor_name && (
              <Text variant="bodyMedium">Doctor: {appointment.doctor_name}</Text>
            )}
            {appointment.location && (
              <Text variant="bodyMedium">Location: {appointment.location}</Text>
            )}
            {appointment.notes && (
              <Text variant="bodyMedium" style={styles.notes}>Notes: {appointment.notes}</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
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
          <View style={styles.headerRow}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="titleLarge" style={styles.headerTitle}>
              Appointments
            </Text>
          </View>
          <View style={styles.filterContainer}>
            <Text variant="titleMedium" style={styles.filterTitle}>
              Filter by Status
            </Text>
            <View style={styles.filterScrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
              >
                <SegmentedButtons
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  buttons={STATUS_OPTIONS}
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
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {error && <ErrorMessage message={error} />}

          {appointments.length === 0 ? (
            <EmptyState
              icon="calendar-clock"
              title="No Appointments"
              message="Add your first appointment by tapping the + button below"
            />
          ) : (
            <View style={styles.content}>
              {appointments.map((appointment) => {
                console.log('Processing appointment:', {
                  id: appointment.id,
                  raw_date: appointment.appointment_date
                });
                return (
                  <Card
                    key={appointment.id}
                    style={styles.card}
                    onPress={() => handleViewAppointment(appointment)}
                  >
                    <Card.Content>
                      <View style={styles.appointmentHeader}>
                        <Text variant="titleMedium" style={styles.doctorName}>
                          Dr. {appointment.doctor_name}
                        </Text>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: `${getStatusColor(appointment.status)}20` }
                          ]}
                          textStyle={{
                            fontSize: 12,
                            color: getStatusColor(appointment.status),
                            fontWeight: '600',
                          }}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Chip>
                      </View>

                      <Text variant="bodyMedium" style={styles.purpose}>
                        {appointment.purpose}
                      </Text>

                      <View style={styles.appointmentDetails}>
                        <View style={styles.detailRow}>
                          <Text variant="bodySmall" style={styles.detailLabel}>
                            Date & Time:
                          </Text>
                          <Text variant="bodySmall" style={styles.detailValue}>
                            {formatAppointmentDate(appointment.appointment_date)}
                          </Text>
                        </View>

                        {appointment.clinic_location && (
                          <View style={styles.detailRow}>
                            <Text variant="bodySmall" style={styles.detailLabel}>
                              Location:
                            </Text>
                            <Text variant="bodySmall" style={styles.detailValue}>
                              {appointment.clinic_location}
                            </Text>
                          </View>
                        )}
                      </View>

                      {appointment.reminder_enabled && (
                        <Chip
                          icon="bell"
                          style={styles.reminderChip}
                          textStyle={{ fontSize: 12, color: '#1976D2' }}
                        >
                          Reminder {appointment.reminder_minutes_before} min before
                        </Chip>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>

        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddAppointment}
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
    backgroundColor: 'transparent',
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  content: {
    flex: 1,
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorName: {
    color: '#333',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  purpose: {
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  detailValue: {
    color: '#333',
    flex: 1,
  },
  reminderChip: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
    height: 28,
    borderRadius: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 4,
  },
});

export default AppointmentsScreen; 