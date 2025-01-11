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
import { LinearGradient } from 'expo-linear-gradient';

const DoctorVisitsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visits, setVisits] = useState([]);
  
  const navigation = useNavigation();
  const theme = useTheme();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const fetchVisits = async () => {
    try {
      setError(null);
      const data = await HealthService.getDoctorVisits();
      console.log('Doctor visits data:', data);
      setVisits(data || []);
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

  const renderVisitCard = (visit) => {
    console.log('Rendering visit:', visit);
    return (
      <Card
        key={visit.id}
        style={styles.card}
        onPress={() => navigation.navigate('DoctorVisitDetails', { visitId: visit.id })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.visitHeader}>
            <View style={styles.doctorInfo}>
              <IconButton
                icon="doctor"
                size={24}
                style={styles.doctorIcon}
                iconColor={theme.colors.primary}
              />
              <View>
                <Text variant="titleMedium" style={styles.doctorName}>
                  Dr. {visit.doctor_name}
                </Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  {formatDate(visit.visit_date)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.visitContent}>
            <Text variant="bodyMedium" style={styles.reasonTitle}>
              Reason for Visit:
            </Text>
            <Text variant="bodyMedium" style={styles.reason}>
              {visit.reason_for_visit}
            </Text>

            {visit.diagnosis && (
              <View style={styles.diagnosisContainer}>
                <Text variant="bodyMedium" style={styles.diagnosisTitle}>
                  Diagnosis:
                </Text>
                <Text variant="bodySmall" style={styles.diagnosis} numberOfLines={2}>
                  {visit.diagnosis}
                </Text>
              </View>
            )}

            {visit.next_visit_date && (
              <View style={[styles.nextVisitContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
                <IconButton
                  icon="calendar"
                  size={20}
                  style={styles.calendarIcon}
                  iconColor={theme.colors.primary}
                />
                <Text style={[styles.nextVisitText, { color: theme.colors.primary }]}>
                  Next Visit: {formatDate(visit.next_visit_date)}
                </Text>
              </View>
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
              {visits.map(renderVisitCard)}
            </View>
          )}
        </ScrollView>
        
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AddDoctorVisit')}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    marginLeft: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    elevation: 3,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  visitHeader: {
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorIcon: {
    margin: 0,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorName: {
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: 16,
  },
  dateText: {
    color: '#666',
    marginTop: 2,
  },
  visitContent: {
    marginTop: 8,
  },
  reasonTitle: {
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reason: {
    color: '#444',
    marginBottom: 12,
  },
  diagnosisContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  diagnosisTitle: {
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  diagnosis: {
    color: '#666',
  },
  nextVisitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 20,
    paddingRight: 12,
  },
  calendarIcon: {
    margin: 0,
  },
  nextVisitText: {
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    elevation: 4,
  },
});

export default DoctorVisitsScreen; 