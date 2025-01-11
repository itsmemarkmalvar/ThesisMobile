import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Divider,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';

const DoctorVisitDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visit, setVisit] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { visitId } = route.params;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const fetchVisit = async () => {
    try {
      setError(null);
      const data = await HealthService.getDoctorVisit(visitId);
      setVisit(data);
    } catch (err) {
      setError('Failed to load doctor visit details');
      console.error('Error fetching doctor visit:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchVisit();
      setLoading(false);
    };
    loadData();
  }, [visitId]);

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate('EditDoctorVisit', { visitId });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Visit',
      'Are you sure you want to delete this doctor visit? This action cannot be undone.',
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
              await HealthService.deleteDoctorVisit(visitId);
              navigation.goBack();
            } catch (err) {
              setError('Failed to delete doctor visit');
              console.error('Error deleting doctor visit:', err);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!visit) {
    return <ErrorMessage message="Doctor visit not found" />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Doctor Visit Details
            </Text>
          </View>

          {error && <ErrorMessage message={error} />}

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="labelLarge">Visit Date</Text>
                <Text variant="bodyLarge">
                  {formatDate(visit.visit_date)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text variant="labelLarge">Doctor</Text>
                <Text variant="bodyLarge">Dr. {visit.doctor_name}</Text>
              </View>

              {visit.clinic_location && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.row}>
                    <Text variant="labelLarge">Location</Text>
                    <Text variant="bodyLarge">{visit.clinic_location}</Text>
                  </View>
                </>
              )}

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="labelLarge">Reason for Visit</Text>
                <Text variant="bodyLarge" style={styles.sectionContent}>
                  {visit.reason_for_visit}
                </Text>
              </View>

              {visit.diagnosis && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Diagnosis</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {visit.diagnosis}
                    </Text>
                  </View>
                </>
              )}

              {visit.prescription && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Prescription</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {visit.prescription}
                    </Text>
                  </View>
                </>
              )}

              {visit.follow_up_instructions && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Follow-up Instructions</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {visit.follow_up_instructions}
                    </Text>
                  </View>
                </>
              )}

              {visit.next_visit_date && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.row}>
                    <Text variant="labelLarge">Next Visit</Text>
                    <Text variant="bodyLarge">
                      {formatDate(visit.next_visit_date)}
                    </Text>
                  </View>
                </>
              )}

              {visit.notes && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.section}>
                    <Text variant="labelLarge">Notes</Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {visit.notes}
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={styles.actionButton}
              icon="pencil"
            >
              Update Visit
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
              icon="delete"
              buttonColor="#dc3545"
            >
              Delete Visit
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Back to List
            </Button>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  backButton: {
    padding: 8,
    marginTop: 8,
  },
});

export default DoctorVisitDetailsScreen; 