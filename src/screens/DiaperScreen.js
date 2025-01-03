import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AddDiaperNoteModal from '../components/diaper/AddDiaperNoteModal';
import { diaperService } from '../services/diaperService';
import { useFocusEffect } from '@react-navigation/native';
import DateFilter from '../components/diaper/DateFilter';
import DiaperStats from '../components/diaper/DiaperStats';
import { format } from 'date-fns';
import { shadowStyles } from '../utils/shadowStyles';

const DiaperScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaperLogs, setDiaperLogs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const formatTime = (time) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.log('Time formatting error:', error);
      return '';
    }
  };

  const renderDiaperLog = (log) => {
    return (
      <TouchableOpacity 
        key={log.id}
        style={styles.logCard}
        onPress={() => {/* Handle log press */}}
      >
        <View style={styles.logHeader}>
          <View style={styles.logType}>
            <MaterialIcons 
              name={log.type === 'wet' ? 'opacity' : 'child-care'} 
              size={24} 
              color={log.type === 'wet' ? '#4A90E2' : '#FF9800'} 
            />
            <Text style={styles.logTypeText}>
              {log.type === 'wet' ? 'Wet' : 'Dirty'}
            </Text>
          </View>
          <Text style={styles.logTime}>
            {formatTime(log.time)}
          </Text>
        </View>
        {log.notes && (
          <Text style={styles.logNotes}>{log.notes}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const loadDiaperLogs = async () => {
    try {
      setIsLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const logs = await diaperService.fetchDiaperLogs(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setDiaperLogs(logs.data);
    } catch (error) {
      console.error('Error loading diaper logs:', error);
      // Handle error (show toast or alert)
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const logs = await diaperService.fetchDiaperLogs(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setDiaperLogs(logs.data);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Show error message to user
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDiaperLogs();
    }, [])
  );

  const handleAddDiaper = async (diaperData) => {
    try {
      const newLog = await diaperService.saveDiaperLog({
        type: diaperData.type || selectedType,
        time: new Date().toISOString(),
        notes: diaperData.notes || ''
      });
      
      // Refresh the list to show the new log
      await loadDiaperLogs();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving diaper log:', error);
      // Show error message to user
      Alert.alert(
        'Error',
        'Failed to save diaper log. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickAction = (type) => {
    setSelectedType(type);
    setModalVisible(true);
  };

  useEffect(() => {
    filterLogsByDate();
  }, [selectedDate, diaperLogs]);

  const filterLogsByDate = () => {
    const filtered = diaperLogs.filter(log => {
      const logDate = new Date(log.time);
      return (
        logDate.getDate() === selectedDate.getDate() &&
        logDate.getMonth() === selectedDate.getMonth() &&
        logDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    setFilteredLogs(filtered);
  };

  const handleShare = async () => {
    try {
      const stats = generateReport();
      
      await Share.share({
        message: stats,
        title: 'Diaper Change Report',
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const generateReport = () => {
    const stats = {
      total: filteredLogs.length,
      wet: filteredLogs.filter(log => log.type === 'wet').length,
      dirty: filteredLogs.filter(log => log.type === 'dirty').length,
    };

    return `Diaper Change Report - ${format(selectedDate, 'MMMM d, yyyy')}
    
Total Changes: ${stats.total}
Wet Diapers: ${stats.wet}
Dirty Diapers: ${stats.dirty}

Detailed Log:
${filteredLogs.map(log => `
Time: ${format(new Date(log.time), 'h:mm a')}
Type: ${log.type}
${log.notes ? `Notes: ${log.notes}` : ''}`).join('\n')}
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFE5E5', '#FFF0F0', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diaper Changes</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
        >
          {/* Date Filter */}
          <DateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          {/* Statistics */}
          <DiaperStats
            diaperLogs={diaperLogs}
            selectedDate={selectedDate}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#E3F2FD' }]}
              onPress={() => handleQuickAction('wet')}
            >
              <MaterialIcons name="opacity" size={24} color="#4A90E2" />
              <Text style={[styles.quickActionText, { color: '#4A90E2' }]}>Wet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#FFF3E0' }]}
              onPress={() => handleQuickAction('dirty')}
            >
              <MaterialIcons name="child-care" size={24} color="#FF9800" />
              <Text style={[styles.quickActionText, { color: '#FF9800' }]}>Dirty</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{filteredLogs.length}</Text>
                <Text style={styles.summaryLabel}>Total Changes</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {filteredLogs.filter(log => log.type === 'wet').length}
                </Text>
                <Text style={styles.summaryLabel}>Wet</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {filteredLogs.filter(log => log.type === 'dirty').length}
                </Text>
                <Text style={styles.summaryLabel}>Dirty</Text>
              </View>
            </View>
          </View>

          {/* Diaper Logs */}
          <View style={styles.logsSection}>
            <Text style={styles.sectionTitle}>Recent Changes</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
            ) : (
              diaperLogs.map(renderDiaperLog)
            )}
          </View>
        </ScrollView>

        <AddDiaperNoteModal
          visible={modalVisible}
          initialType={selectedType}
          onClose={() => setModalVisible(false)}
          onSave={handleAddDiaper}
        />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
    ...shadowStyles.small,
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadowStyles.small,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  logsSection: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...shadowStyles.small,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTypeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
  },
  logNotes: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
});

export default DiaperScreen; 