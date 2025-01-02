import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
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
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const AppointmentDetailsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { appointmentId } = route.params;

  const fetchAppointment = async () => {
    try {
      setError(null);
      const data = await HealthService.getAppointment(appointmentId);
      setAppointment(data);
    } catch (err) {
      setError('Failed to load appointment details');
      console.error('Error fetching appointment:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAppointment();
      setLoading(false);
    };
    loadData();
  }, [appointmentId]);

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate('EditAppointment', { appointmentId });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment? This action cannot be undone.',
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
              await HealthService.deleteAppointment(appointmentId);
              navigation.goBack();
            } catch (err) {
              setError('Failed to delete appointment');
              console.error('Error deleting appointment:', err);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (status) => {
    try {
      setLoading(true);
      await HealthService.updateAppointment(appointmentId, {
        ...appointment,
        status,
      });
      await fetchAppointment();
    } catch (err) {
      setError('Failed to update appointment status');
      console.error('Error updating appointment status:', err);
    } finally {
      setLoading(false);
    }
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

  if (!appointment) {
    return <ErrorMessage message="Appointment not found" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Appointment Details
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
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
          <View style={styles.statusSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Status
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusScroll}
            >
              <SegmentedButtons
                value={appointment.status}
                onValueChange={handleUpdateStatus}
                buttons={STATUS_OPTIONS}
                style={styles.segmentedButtons}
              />
            </ScrollView>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="labelLarge">Date & Time</Text>
            <Text variant="bodyLarge" style={styles.sectionContent}>
              {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="labelLarge">Doctor</Text>
            <Text variant="bodyLarge" style={styles.sectionContent}>
              Dr. {appointment.doctor_name}
            </Text>
          </View>

          {appointment.clinic_location && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="labelLarge">Location</Text>
                <Text variant="bodyLarge" style={styles.sectionContent}>
                  {appointment.clinic_location}
                </Text>
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="labelLarge">Purpose</Text>
            <Text variant="bodyLarge" style={styles.sectionContent}>
              {appointment.purpose}
            </Text>
          </View>

          {appointment.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="labelLarge">Notes</Text>
                <Text variant="bodyLarge" style={styles.sectionContent}>
                  {appointment.notes}
                </Text>
              </View>
            </>
          )}

          {appointment.reminder_enabled && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.reminderSection}>
                <Chip
                  icon="bell"
                  style={styles.reminderChip}
                >
                  Reminder {appointment.reminder_minutes_before} minutes before
                </Chip>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  statusSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  statusScroll: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginRight: 16,
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
  reminderSection: {
    paddingVertical: 8,
  },
  reminderChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    padding: 8,
  },
});

export default AppointmentDetailsScreen; 