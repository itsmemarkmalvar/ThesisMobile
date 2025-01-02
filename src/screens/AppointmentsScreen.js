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
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

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
      const response = await HealthService.getAppointments(
        null,
        null,
        selectedStatus || undefined
      );
      setAppointments(response.data || []);
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

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

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
          <Text variant="titleMedium" style={styles.filterTitle}>
            Filter by Status
          </Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <SegmentedButtons
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            buttons={STATUS_OPTIONS}
            style={styles.segmentedButtons}
            density="small"
          />
        </ScrollView>
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
            {appointments.map((appointment) => (
              <Card
                key={appointment.id}
                style={styles.card}
                onPress={() => handleViewAppointment(appointment)}
              >
                <Card.Content>
                  <View style={styles.appointmentHeader}>
                    <Text variant="titleMedium">
                      Dr. {appointment.doctor_name}
                    </Text>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${getStatusColor(appointment.status)}20` }
                      ]}
                      textStyle={{
                        fontSize: 12,
                        color: getStatusColor(appointment.status)
                      }}
                    >
                      {appointment.status}
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
                      <Text variant="bodySmall">
                        {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')}
                      </Text>
                    </View>

                    {appointment.clinic_location && (
                      <View style={styles.detailRow}>
                        <Text variant="bodySmall" style={styles.detailLabel}>
                          Location:
                        </Text>
                        <Text variant="bodySmall">
                          {appointment.clinic_location}
                        </Text>
                      </View>
                    )}
                  </View>

                  {appointment.reminder_enabled && (
                    <Chip
                      icon="bell"
                      style={styles.reminderChip}
                      textStyle={{ fontSize: 12 }}
                    >
                      Reminder {appointment.reminder_minutes_before} min before
                    </Chip>
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
        onPress={handleAddAppointment}
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
  header: {
    backgroundColor: 'white',
    elevation: 2,
    paddingBottom: 8,
  },
  headerRow: {
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  segmentedButtons: {
    minWidth: '100%',
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
    marginBottom: 12,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AppointmentsScreen; 