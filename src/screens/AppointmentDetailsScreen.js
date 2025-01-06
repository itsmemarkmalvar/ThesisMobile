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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Appointment not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
              Appointment Details
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {error && <ErrorMessage message={error} />}

          <View style={styles.content}>
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
                      buttons={[
                        {
                          value: 'scheduled',
                          label: 'Scheduled',
                          style: [
                            styles.segmentedButton,
                            appointment.status === 'scheduled' && {
                              backgroundColor: getStatusColor('scheduled'),
                            },
                          ],
                        },
                        {
                          value: 'completed',
                          label: 'Completed',
                          style: [
                            styles.segmentedButton,
                            appointment.status === 'completed' && {
                              backgroundColor: getStatusColor('completed'),
                            },
                          ],
                        },
                        {
                          value: 'cancelled',
                          label: 'Cancelled',
                          style: [
                            styles.segmentedButton,
                            appointment.status === 'cancelled' && {
                              backgroundColor: getStatusColor('cancelled'),
                            },
                          ],
                        },
                        {
                          value: 'rescheduled',
                          label: 'Rescheduled',
                          style: [
                            styles.segmentedButton,
                            appointment.status === 'rescheduled' && {
                              backgroundColor: getStatusColor('rescheduled'),
                            },
                          ],
                        },
                      ]}
                      style={styles.segmentedButtons}
                    />
                  </ScrollView>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Date & Time</Text>
                  <Text style={styles.sectionContent}>
                    {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Doctor</Text>
                  <Text style={styles.sectionContent}>
                    Dr. {appointment.doctor_name}
                  </Text>
                </View>

                {appointment.clinic_location && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Location</Text>
                      <Text style={styles.sectionContent}>
                        {appointment.clinic_location}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Purpose</Text>
                  <Text style={styles.sectionContent}>
                    {appointment.purpose}
                  </Text>
                </View>

                {appointment.notes && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Notes</Text>
                    <Text style={styles.sectionContent}>
                      {appointment.notes}
                    </Text>
                  </View>
                )}

                {appointment.reminder_enabled && (
                  <View style={styles.reminderSection}>
                    <Chip
                      icon="bell"
                      style={styles.reminderChip}
                      textStyle={{ color: '#1976D2' }}
                    >
                      Reminder {appointment.reminder_minutes_before} minutes before
                    </Chip>
                  </View>
                )}
              </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleEdit}
                style={[styles.button, styles.editButton]}
                labelStyle={styles.buttonLabel}
              >
                Edit Appointment
              </Button>
              <Button
                mode="outlined"
                onPress={handleDelete}
                style={[styles.button, styles.deleteButton]}
                labelStyle={[styles.buttonLabel, styles.deleteButtonLabel]}
              >
                Delete Appointment
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Appointments')}
                style={[styles.button, styles.backButton]}
                labelStyle={styles.buttonLabel}
              >
                Back to List
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
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
  statusSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
  },
  statusScroll: {
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  sectionContent: {
    color: '#333',
    lineHeight: 24,
  },
  reminderSection: {
    marginTop: 8,
  },
  reminderChip: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    borderColor: '#1976D2',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginVertical: 4,
  },
  buttonLabel: {
    color: '#1976D2',
  },
  editButton: {
    borderColor: '#1976D2',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  deleteButtonLabel: {
    color: '#F44336',
  },
  backButton: {
    marginTop: 8,
  },
});

export default AppointmentDetailsScreen; 