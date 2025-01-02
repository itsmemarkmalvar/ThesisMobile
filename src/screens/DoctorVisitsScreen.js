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

const DoctorVisitsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visits, setVisits] = useState([]);
  
  const navigation = useNavigation();
  const theme = useTheme();

  const fetchVisits = async () => {
    try {
      setError(null);
      const response = await HealthService.getDoctorVisits();
      setVisits(response.data || []);
    } catch (err) {
      setError('Failed to load doctor visits');
      console.error('Error fetching doctor visits:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchVisits();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVisits();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall" style={styles.title}>Doctor Visits</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {error && <ErrorMessage message={error} />}

        {visits.length === 0 ? (
          <EmptyState
            icon="doctor"
            title="No Doctor Visits"
            message="Add your first doctor visit by tapping the + button below"
          />
        ) : (
          <View style={styles.content}>
            {visits.map((visit) => (
              <Card
                key={visit.id}
                style={styles.card}
                onPress={() => navigation.navigate('DoctorVisitDetails', { visitId: visit.id })}
              >
                <Card.Content>
                  <View style={styles.visitHeader}>
                    <Text variant="titleMedium">
                      Dr. {visit.doctor_name}
                    </Text>
                    <Text variant="bodySmall">
                      {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                    </Text>
                  </View>

                  <Text variant="bodyMedium" style={styles.reason}>
                    {visit.reason_for_visit}
                  </Text>

                  {visit.diagnosis && (
                    <Text variant="bodySmall" numberOfLines={2} style={styles.diagnosis}>
                      Diagnosis: {visit.diagnosis}
                    </Text>
                  )}

                  {visit.next_visit_date && (
                    <Chip
                      icon="calendar"
                      style={styles.nextVisitChip}
                      textStyle={{ fontSize: 12 }}
                    >
                      Next Visit: {format(new Date(visit.next_visit_date), 'MMM d, yyyy')}
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
        onPress={() => navigation.navigate('AddDoctorVisit')}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  title: {
    flex: 1,
    marginLeft: 16,
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
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reason: {
    marginBottom: 8,
  },
  diagnosis: {
    color: '#666',
    marginBottom: 8,
  },
  nextVisitChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DoctorVisitsScreen; 