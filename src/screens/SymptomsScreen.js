import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  useTheme,
  Chip,
  SegmentedButtons,
  IconButton,
  Portal,
  Modal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { HealthService } from '../services/HealthService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

const SEVERITY_LEVELS = [
  { value: '', label: 'All' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const SymptomsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  
  const navigation = useNavigation();
  const theme = useTheme();

  const fetchSymptoms = async () => {
    try {
      setError(null);
      const response = await HealthService.getSymptoms(
        selectedSeverity
      );
      setSymptoms(response.data || []);
    } catch (err) {
      setError('Failed to load symptoms');
      console.error('Error fetching symptoms:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchSymptoms();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSymptoms();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedSeverity]);

  const handleAddSymptom = () => {
    navigation.navigate('AddSymptom');
  };

  const handleViewSymptom = (symptom) => {
    // Ensure dates are valid before setting the selected symptom
    const safeSymptom = {
      ...symptom,
      onset_date: symptom.onset_date ? new Date(symptom.onset_date).toISOString() : null,
      resolved_date: symptom.resolved_date ? new Date(symptom.resolved_date).toISOString() : null
    };
    
    try {
      // Validate dates before setting
      if (safeSymptom.onset_date) {
        const onsetDate = new Date(safeSymptom.onset_date);
        if (isNaN(onsetDate.getTime())) {
          safeSymptom.onset_date = null;
        }
      }
      
      if (safeSymptom.resolved_date) {
        const resolvedDate = new Date(safeSymptom.resolved_date);
        if (isNaN(resolvedDate.getTime())) {
          safeSymptom.resolved_date = null;
        }
      }
      
      setSelectedSymptom(safeSymptom);
    } catch (error) {
      console.error('Error handling symptom dates:', error);
      // Still show the symptom but with null dates
      setSelectedSymptom({
        ...symptom,
        onset_date: null,
        resolved_date: null
      });
    }
  };

  const handleEditSymptom = () => {
    if (selectedSymptom) {
      navigation.navigate('EditSymptom', { symptomId: selectedSymptom.id });
      setSelectedSymptom(null);
    }
  };

  const handleDeleteSymptom = async (symptomId) => {
    try {
      await HealthService.deleteSymptom(symptomId);
      setSelectedSymptom(null);
      // Refresh the symptoms list
      handleRefresh();
    } catch (error) {
      console.error('Error deleting symptom:', error);
      alert('Failed to delete symptom. Please try again.');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'severe':
        return '#F44336';
      default:
        return theme.colors.primary;
    }
  };

  const getDurationText = (startDate, endDate) => {
    if (!startDate) return 'Unknown duration';
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return 'Invalid duration';
      }

      const end = endDate ? new Date(endDate) : new Date();
      if (endDate && isNaN(end.getTime())) {
        return 'Invalid duration';
      }

      const diffTime = Math.abs(end - start);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return endDate ? `${days} days` : `${days} days (Ongoing)`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Invalid duration';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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
            <Text variant="titleMedium" style={styles.headerTitle}>
              Symptoms
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

          <View style={styles.filters}>
            <Text variant="titleMedium" style={styles.filterTitle}>
              Filter by Severity
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <SegmentedButtons
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
                buttons={SEVERITY_LEVELS}
                style={styles.segmentedButtons}
              />
            </ScrollView>
          </View>

          {symptoms.length === 0 ? (
            <EmptyState
              icon="medical-bag"
              title="No Symptoms"
              message="Add your first symptom by tapping the + button below"
            />
          ) : (
            <View style={styles.content}>
              {symptoms.map((symptom) => (
                <Card
                  key={symptom.id}
                  style={styles.card}
                  onPress={() => handleViewSymptom(symptom)}
                >
                  <Card.Content>
                    <View style={styles.symptomHeader}>
                      <Text variant="titleMedium" style={styles.title}>
                        {symptom.name}
                      </Text>
                      <View style={styles.chipContainer}>
                        <Chip
                          style={[
                            styles.severityChip,
                            { backgroundColor: `${getSeverityColor(symptom.severity)}15` }
                          ]}
                          textStyle={{
                            color: getSeverityColor(symptom.severity),
                            fontSize: 12,
                            fontWeight: '500',
                          }}
                          compact={false}
                        >
                          {symptom.severity}
                        </Chip>
                      </View>
                    </View>

                    {symptom.description && (
                      <Text 
                        variant="bodyMedium" 
                        style={styles.description}
                        numberOfLines={2}
                      >
                        {symptom.description}
                      </Text>
                    )}

                    <View style={styles.symptomDetails}>
                      <View style={styles.detailRow}>
                        <Text variant="bodySmall" style={styles.detailLabel}>
                          Start Date
                        </Text>
                        <Text variant="bodySmall" style={styles.detailValue}>
                          {formatDate(symptom.onset_date)}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text variant="bodySmall" style={styles.detailLabel}>
                          Duration
                        </Text>
                        <Text variant="bodySmall" style={styles.detailValue}>
                          {getDurationText(symptom.onset_date, symptom.resolved_date)}
                        </Text>
                      </View>
                    </View>

                    <Button
                      mode="outlined"
                      onPress={() => handleDeleteSymptom(symptom.id)}
                      style={[styles.deleteButton, { borderColor: theme.colors.error }]}
                      icon="delete"
                      textColor={theme.colors.error}
                    >
                      Delete
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddSymptom}
          color="white"
          theme={{
            colors: {
              primaryContainer: '#1976D2',
            },
          }}
        />

        <Portal>
          <Modal
            visible={!!selectedSymptom}
            onDismiss={() => setSelectedSymptom(null)}
            contentContainerStyle={styles.modalContent}
          >
            {selectedSymptom && (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="titleLarge" style={styles.modalTitle}>
                    {selectedSymptom.name}
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setSelectedSymptom(null)}
                  />
                </View>

                <ScrollView>
                  <View style={styles.modalChips}>
                    <Chip
                      style={[
                        styles.severityChip,
                        { backgroundColor: `${getSeverityColor(selectedSymptom.severity)}15` }
                      ]}
                      textStyle={{
                        color: getSeverityColor(selectedSymptom.severity),
                        fontWeight: '500',
                      }}
                    >
                      {selectedSymptom.severity}
                    </Chip>
                  </View>

                  {selectedSymptom.description && (
                    <View style={styles.modalSection}>
                      <Text variant="titleSmall" style={styles.sectionTitle}>
                        Description
                      </Text>
                      <Text variant="bodyMedium" style={styles.modalDescription}>
                        {selectedSymptom.description}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      Timeline
                    </Text>
                    <View style={styles.timelineDetails}>
                      <View style={styles.timelineRow}>
                        <Text variant="bodyMedium" style={styles.timelineLabel}>
                          Start Date
                        </Text>
                        <Text variant="bodyMedium" style={styles.timelineValue}>
                          {formatDate(selectedSymptom.onset_date)}
                        </Text>
                      </View>

                      <View style={styles.timelineRow}>
                        <Text variant="bodyMedium" style={styles.timelineLabel}>
                          Duration
                        </Text>
                        <Text variant="bodyMedium" style={styles.timelineValue}>
                          {getDurationText(selectedSymptom.onset_date, selectedSymptom.resolved_date)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      mode="contained"
                      onPress={handleEditSymptom}
                      style={styles.editButton}
                    >
                      Edit Symptom
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleDeleteSymptom(selectedSymptom.id)}
                      style={[styles.deleteButton, { borderColor: theme.colors.error }]}
                      textColor={theme.colors.error}
                      icon="delete"
                    >
                      Delete Symptom
                    </Button>
                  </View>
                </ScrollView>
              </>
            )}
          </Modal>
        </Portal>
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
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  filters: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  filterTitle: {
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  statusFilterTitle: {
    marginTop: 16,
  },
  filterScroll: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chipContainer: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
    minWidth: 80,
  },
  severityChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  description: {
    marginBottom: 16,
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  symptomDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 13,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  modalChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#4B5563',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalDescription: {
    color: '#1F2937',
    lineHeight: 24,
  },
  timelineDetails: {
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineLabel: {
    color: '#6B7280',
  },
  timelineValue: {
    color: '#1F2937',
    fontWeight: '500',
  },
  modalActions: {
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  deleteButton: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default SymptomsScreen; 