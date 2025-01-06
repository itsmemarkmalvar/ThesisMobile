import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import FeedingService from '../services/FeedingService';
import { format } from 'date-fns';

const FeedingScreen = ({ navigation }) => {
  const [feedingLogs, setFeedingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState(null);

  const loadFeedingLogs = async (date = selectedDate) => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Loading feeding logs for date:', formattedDate);
      
      const [logsData, statsData] = await Promise.all([
        FeedingService.getFeedingLogs(formattedDate),
        FeedingService.getFeedingStats(formattedDate)
      ]);
      
      console.log('Received feeding logs:', logsData);
      console.log('Received stats:', statsData);
      
      const logs = logsData.data || logsData;
      setFeedingLogs(logs);
      setStats(statsData);
      
      console.log('Setting feedingLogs to:', logs);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to load feeding logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedingLogs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeedingLogs();
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      loadFeedingLogs(date);
    }
  };

  const handleAddFeeding = () => {
    navigation.navigate('AddFeeding');
  };

  const renderFeedingLog = ({ item }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'breast':
          return 'child-care';
        case 'bottle':
          return 'local-drink';
        case 'solid':
          return 'restaurant';
        default:
          return 'help';
      }
    };

    const formatTime = (dateString) => {
      return format(new Date(dateString), 'h:mm a');
    };

    const getDetails = (log) => {
      switch (log.type) {
        case 'breast':
          return `${log.duration} mins - ${log.breast_side} side`;
        case 'bottle':
          return `${log.amount} ml - ${log.duration} mins`;
        case 'solid':
          return log.food_type;
        default:
          return '';
      }
    };

    return (
      <TouchableOpacity
        style={styles.logItem}
        onPress={() => navigation.navigate('EditFeeding', { feedingLog: item })}
      >
        <View style={styles.logIcon}>
          <MaterialIcons name={getIcon(item.type)} size={24} color="#4A90E2" />
        </View>
        <View style={styles.logDetails}>
          <Text style={styles.logTime}>{formatTime(item.start_time)}</Text>
          <Text style={styles.logType}>{item.type.toUpperCase()}</Text>
          <Text style={styles.logInfo}>{getDetails(item)}</Text>
          {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Today's Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total_feedings}</Text>
            <Text style={styles.statLabel}>Total Feedings</Text>
          </View>
          {Object.entries(stats.by_type).map(([type, count]) => (
            <View key={type} style={styles.statItem}>
              <Text style={styles.statNumber}>{count}</Text>
              <Text style={styles.statLabel}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    console.log('feedingLogs state updated:', feedingLogs);
  }, [feedingLogs]);

  useEffect(() => {
    console.log('stats state updated:', stats);
  }, [stats]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2E3A59" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color="#4A90E2" />
            <Text style={styles.dateText}>
              {format(selectedDate, 'MMM d, yyyy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddFeeding}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {renderStats()}

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#4A90E2" />
        ) : (
          <FlatList
            data={feedingLogs}
            renderItem={renderFeedingLog}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="no-meals" size={48} color="#8F9BB3" />
                <Text style={styles.emptyText}>No feeding logs for this day</Text>
                <Text style={styles.emptySubText}>
                  Tap the + button to add a feeding log
                </Text>
              </View>
            }
          />
        )}

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1'
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    gap: 8
  },
  dateText: {
    fontSize: 16,
    color: '#2E3A59',
    fontWeight: '500'
  },
  addButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 14,
    color: '#8F9BB3',
    textTransform: 'capitalize'
  },
  listContent: {
    padding: 16,
    paddingTop: 0
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  logDetails: {
    flex: 1
  },
  logTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 4
  },
  logType: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginBottom: 4
  },
  logInfo: {
    fontSize: 14,
    color: '#2E3A59',
    marginBottom: 2
  },
  logNotes: {
    fontSize: 14,
    color: '#8F9BB3',
    fontStyle: 'italic'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    margin: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubText: {
    fontSize: 14,
    color: '#8F9BB3',
    textAlign: 'center'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default FeedingScreen; 