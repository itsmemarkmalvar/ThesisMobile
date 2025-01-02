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
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const DoctorVisitDetailsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visit, setVisit] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { visitId } = route.params;

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Doctor Visit Details
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
          <View style={styles.row}>
            <Text variant="labelLarge">Visit Date</Text>
            <Text variant="bodyLarge">
              {format(new Date(visit.visit_date), 'MMM d, yyyy')}
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
                  {format(new Date(visit.next_visit_date), 'MMM d, yyyy')}
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
  },
  button: {
    padding: 8,
  },
});

export default DoctorVisitDetailsScreen; 