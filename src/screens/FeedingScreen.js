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
      const [logsData, statsData] = await Promise.all([
        FeedingService.getFeedingLogs(formattedDate),
        FeedingService.getFeedingStats(formattedDate)
      ]);
      setFeedingLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading feeding logs:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF9A9E', '#FAD0C4', '#FFF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
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
            <MaterialIcons name="add" size={24} color="#FFF" />
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="no-meals" size={48} color="#999" />
                <Text style={styles.emptyText}>No feeding logs for this day</Text>
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
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statsContainer: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  logTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logType: {
    fontSize: 14,
    color: '#4A90E2',
    marginVertical: 4,
  },
  logInfo: {
    fontSize: 14,
    color: '#666',
  },
  logNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedingScreen; 