import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Alert,
  Pressable,
  RefreshControl,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useBaby } from '../context/BabyContext';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Animated as ReAnimated
} from 'react-native-reanimated';
import MilestoneService from '../services/MilestoneService';

const initialLayout = { width: Dimensions.get('window').width };
const chartWidth = Dimensions.get('window').width - (Platform.OS === 'ios' ? 60 : 50);

const GrowthTrackingScreen = ({ navigation, route }) => {
  const { babyData, updateBabyData } = useBaby();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [growthData, setGrowthData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    height: '',
    weight: '',
    head_size: '',
    date_recorded: new Date(),
    notes: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Simplified tab state
  const [activeTab, setActiveTab] = useState('history');

  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [milestonesError, setMilestonesError] = useState(null);

  const fetchMilestones = async () => {
    if (!babyData?.id) {
      setMilestonesError('No baby selected');
      setMilestonesLoading(false);
      return;
    }

    try {
      setMilestonesLoading(true);
      setMilestonesError(null);
      
      // First try to get existing milestones
      const response = await MilestoneService.getMilestones(babyData.id);
      console.log('Milestones response:', response);
      
      if (!response.success || !response.data || response.data.length === 0) {
        console.log('No milestones found, initializing...');
        // Initialize milestones if none exist
        const initResponse = await MilestoneService.initializeMilestones(babyData.id);
        console.log('Initialize response:', initResponse);
        
        if (initResponse.success) {
          // Fetch milestones again after initialization
          const newResponse = await MilestoneService.getMilestones(babyData.id);
          console.log('New milestones response:', newResponse);
          
          if (newResponse.success && newResponse.data) {
            const groupedMilestones = groupMilestonesByCategory(newResponse.data);
            setMilestones(groupedMilestones);
          } else {
            setMilestonesError('Failed to load milestones after initialization');
          }
        } else {
          setMilestonesError('Failed to initialize milestones');
        }
      } else {
        const groupedMilestones = groupMilestonesByCategory(response.data);
        setMilestones(groupedMilestones);
      }
    } catch (error) {
      console.error('Error in fetchMilestones:', error);
      setMilestonesError('Failed to load milestones');
      setMilestones([]);
    } finally {
      setMilestonesLoading(false);
    }
  };

  const groupMilestonesByCategory = (milestonesData) => {
    if (!Array.isArray(milestonesData)) {
      console.warn('Invalid milestones data:', milestonesData);
      return [];
    }

    return milestonesData.reduce((acc, milestone) => {
      const category = acc.find(g => g.age === milestone.category);
      if (category) {
        category.milestones.push({
          id: milestone.id,
          title: milestone.title,
          completed: milestone.completed,
          notes: milestone.notes
        });
      } else {
        acc.push({
          id: acc.length + 1,
          age: milestone.category,
          milestones: [{
            id: milestone.id,
            title: milestone.title,
            completed: milestone.completed,
            notes: milestone.notes
          }]
        });
      }
      return acc;
    }, []);
  };

  const toggleMilestone = async (ageGroupId, milestoneId) => {
    if (!babyData?.id) {
      Alert.alert('Error', 'No baby selected');
      return;
    }

    try {
      const response = await MilestoneService.toggleMilestone(babyData.id, milestoneId);
      if (response.success) {
        setMilestones(prevMilestones => 
          prevMilestones.map(ageGroup => {
            if (ageGroup.id === ageGroupId) {
              return {
                ...ageGroup,
                milestones: ageGroup.milestones.map(milestone => 
                  milestone.id === milestoneId
                    ? { ...milestone, completed: !milestone.completed }
                    : milestone
                )
              };
            }
            return ageGroup;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        setGrowthData([]);
        return;
      }

      console.log('Fetching growth data...');
      const response = await axios.get(`${API_URL}/growth/charts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Raw API Response:', response.data);

      if (response.data?.data) {
        const formattedData = response.data.data
          .filter(record => record && (record.height || record.weight || record.head_size))
          .map(record => {
            // Ensure date is properly formatted
            let formattedDate;
            if (record.created_at) {
              formattedDate = new Date(record.created_at).toISOString().split('T')[0];
            } else if (record.date_recorded) {
              formattedDate = new Date(record.date_recorded).toISOString().split('T')[0];
            } else {
              formattedDate = new Date().toISOString().split('T')[0];
            }

            return {
              ...record,
              height: parseFloat(record.height) || 0,
              weight: parseFloat(record.weight) || 0,
              head_size: parseFloat(record.head_size) || 0,
              date_recorded: formattedDate
            };
          })
          .sort((a, b) => new Date(b.date_recorded) - new Date(a.date_recorded)); // Sort by newest first

        console.log('Formatted Data:', formattedData);
        setGrowthData(formattedData);
      } else {
        console.warn('No data in API response:', response.data);
        setGrowthData([]);
      }
    } catch (error) {
      console.error('Error fetching growth data:', error.response?.data || error);
      Alert.alert('Error', 'Failed to load growth data');
      setGrowthData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      await axios.post(`${API_URL}/growth/record`, {
        ...newRecord,
        date_recorded: newRecord.date_recorded.toISOString().split('T')[0]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      Alert.alert('Success', 'Growth record added successfully');
      setModalVisible(false);
      fetchGrowthData(); // Refresh data
    } catch (error) {
      console.error('Error adding growth record:', error);
      Alert.alert('Error', 'Failed to add growth record');
    }
  };

  const handleAddMeasurement = async () => {
    try {
      // Check for empty required fields first
      if (!newRecord.height.trim()) {
        Alert.alert('Error', 'Please enter the height');
        return;
      }
      if (!newRecord.weight.trim()) {
        Alert.alert('Error', 'Please enter the weight');
        return;
      }
      if (!newRecord.head_size.trim()) {
        Alert.alert('Error', 'Please enter the head size');
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        navigation.replace('Auth');
        return;
      }

      // Validate measurements
      const height = parseFloat(newRecord.height);
      const weight = parseFloat(newRecord.weight);
      const headSize = parseFloat(newRecord.head_size);
      const date = new Date(newRecord.date_recorded);

      if (isNaN(date.getTime())) {
        Alert.alert('Error', 'Please select a valid date');
        return;
      }

      if (isNaN(height) || height <= 0 || height > 200) {
        Alert.alert('Error', 'Please enter a valid height (0-200 cm)');
        return;
      }
      if (isNaN(weight) || weight <= 0 || weight > 50) {
        Alert.alert('Error', 'Please enter a valid weight (0-50 kg)');
        return;
      }
      if (isNaN(headSize) || headSize <= 0 || headSize > 100) {
        Alert.alert('Error', 'Please enter a valid head size (0-100 cm)');
        return;
      }

      const measurementData = {
        height: height.toFixed(1),
        weight: weight.toFixed(1),
        head_size: headSize.toFixed(1),
        date_recorded: date.toISOString().split('T')[0],
        notes: newRecord.notes.trim()
      };

      const response = await axios.post(`${API_URL}/growth/record`, measurementData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.data.success) {
        await fetchGrowthData(); // Refresh data after successful addition
        setModalVisible(false);
        setNewRecord({
          height: '',
          weight: '',
          head_size: '',
          date_recorded: new Date(),
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding measurement:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add measurement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      // First try parsing as ISO string
      let date = new Date(dateString);
      
      // If invalid, try parsing as YYYY-MM-DD
      if (isNaN(date.getTime()) && typeof dateString === 'string') {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
      
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date parsing error:', e);
      return 'Invalid Date';
    }
  };

  const formatChartData = (data, unit) => {
    console.log('Formatting chart data for unit:', unit, 'Data:', data);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data available for chart');
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }

    try {
      // Filter and sort the data
      const validData = data
        .filter(record => {
          const isValid = record && record[unit] && record.date_recorded;
          if (!isValid) {
            console.log('Invalid record:', record);
          }
          return isValid;
        })
        .sort((a, b) => new Date(a.date_recorded) - new Date(b.date_recorded));

      console.log('Valid data for chart:', validData);

      if (validData.length === 0) {
        return {
          labels: [],
          datasets: [{ data: [] }]
        };
      }

      const chartData = {
        labels: validData.map(record => {
          const date = new Date(record.date_recorded);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}/${day}`;
        }),
        datasets: [{
          data: validData.map(record => parseFloat(record[unit]) || 0),
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }]
      };

      console.log('Chart data:', chartData);
      return chartData;
    } catch (error) {
      console.error('Error formatting chart data:', error);
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
  };

  const renderChartsTab = () => {
    if (!growthData || growthData.length === 0) {
      return (
        <EmptyState
          title="No Growth Records Yet"
          message="Start tracking your baby's growth by adding your first record"
          icon="child-care"
        />
      );
    }

    return (
      <View style={[styles.tabContainer, { backgroundColor: 'transparent' }]}>
        <ScrollView
          style={[styles.chartsScrollView, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.chartsScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4A90E2"
              colors={['#4A90E2']}
            />
          }
        >
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Height Progress (cm)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={formatChartData(growthData, 'height')}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" cm"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: Platform.OS === 'ios' ? '4' : '6',
                    strokeWidth: Platform.OS === 'ios' ? '1.5' : '2',
                    stroke: '#4A90E2'
                  },
                  propsForLabels: {
                    fontSize: Platform.OS === 'ios' ? 10 : 12
                  }
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                segments={4}
              />
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weight Progress (kg)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={formatChartData(growthData, 'weight')}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" kg"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: Platform.OS === 'ios' ? '4' : '6',
                    strokeWidth: Platform.OS === 'ios' ? '1.5' : '2',
                    stroke: '#4A90E2'
                  },
                  propsForLabels: {
                    fontSize: Platform.OS === 'ios' ? 10 : 12
                  }
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                segments={4}
              />
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Head Size Progress (cm)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={formatChartData(growthData, 'head_size')}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" cm"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: Platform.OS === 'ios' ? '4' : '6',
                    strokeWidth: Platform.OS === 'ios' ? '1.5' : '2',
                    stroke: '#4A90E2'
                  },
                  propsForLabels: {
                    fontSize: Platform.OS === 'ios' ? 10 : 12
                  }
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                segments={4}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.loadingText}>Loading data...</Text>
    </View>
  );

  const EmptyState = ({ title, message, icon }) => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name={icon} size={64} color="#BDBDBD" />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.emptyStateButtonText}>Add First Record</Text>
      </TouchableOpacity>
    </View>
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchGrowthData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        if (!growthData || growthData.length === 0) {
          return (
            <EmptyState
              title="No Growth Records Yet"
              message="Start tracking your baby's growth by adding your first record"
              icon="child-care"
            />
          );
        }
        return (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4A90E2"
                colors={['#4A90E2']}
                progressBackgroundColor="#ffffff"
              />
            }
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Growth History</Text>
              {growthData.map((record, index) => renderHistoryCard(record, index))}
            </View>
          </ScrollView>
        );

      case 'charts':
        return renderChartsTab();

      case 'milestones':
        return (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={milestonesLoading}
                onRefresh={fetchMilestones}
                tintColor="#4A90E2"
                colors={['#4A90E2']}
              />
            }
          >
            {milestonesError ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>{milestonesError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchMilestones}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : milestonesLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading milestones...</Text>
              </View>
            ) : !Array.isArray(milestones) || milestones.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="emoji-events" size={64} color="#BDBDBD" />
                <Text style={styles.emptyStateTitle}>No Milestones Yet</Text>
                <Text style={styles.emptyStateMessage}>
                  Track your baby's developmental milestones here
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchMilestones}
                >
                  <Text style={styles.retryButtonText}>Initialize Milestones</Text>
                </TouchableOpacity>
              </View>
            ) : (
              milestones.map((ageGroup) => (
                <View key={ageGroup.id} style={styles.milestoneGroup}>
                  <Text style={styles.milestoneAgeTitle}>{ageGroup.age}</Text>
                  {ageGroup.milestones && ageGroup.milestones.map((milestone) => (
                    <TouchableOpacity
                      key={milestone.id}
                      style={styles.milestoneItem}
                      onPress={() => toggleMilestone(ageGroup.id, milestone.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.milestoneContent}>
                        <MaterialIcons
                          name={milestone.completed ? "check-circle" : "radio-button-unchecked"}
                          size={24}
                          color={milestone.completed ? "#4CAF50" : "#BDBDBD"}
                          style={styles.milestoneIcon}
                        />
                        <Text style={[
                          styles.milestoneText,
                          milestone.completed && styles.milestoneTextCompleted
                        ]}>
                          {milestone.title}
                        </Text>
                      </View>
                      {milestone.notes && (
                        <Text style={styles.milestoneNotes}>{milestone.notes}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const CustomTabBar = () => (
    <View style={styles.customTabBar}>
      {[
        { key: 'history', title: 'History', icon: 'history' },
        { key: 'charts', title: 'Charts', icon: 'insert-chart' },
        { key: 'milestones', title: 'Milestones', icon: 'emoji-events' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.activeTabButton
          ]}
          onPress={() => setActiveTab(tab.key)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={tab.icon}
            size={24}
            color={activeTab === tab.key ? '#4A90E2' : '#666666'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.activeTabButtonText
            ]}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHistoryCard = (record, index) => (
    <View key={index} style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={20} color="#666" />
          <Text style={styles.dateText}>
            {formatDate(record.date_recorded)}
          </Text>
        </View>
      </View>
      <View style={styles.measurementsGrid}>
        <View style={styles.measurementItem}>
          <View style={[styles.measurementIcon, { backgroundColor: '#E3F2FD' }]}>
            <MaterialIcons name="straighten" size={24} color="#1976D2" />
          </View>
          <Text style={styles.measurementValue}>{record.height} cm</Text>
          <Text style={styles.measurementLabel}>Height</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: '#F0F0F0' }]} />
        <View style={styles.measurementItem}>
          <View style={[styles.measurementIcon, { backgroundColor: '#FFF3E0' }]}>
            <MaterialIcons name="monitor-weight" size={24} color="#F57C00" />
          </View>
          <Text style={styles.measurementValue}>{record.weight} kg</Text>
          <Text style={styles.measurementLabel}>Weight</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: '#F0F0F0' }]} />
        <View style={styles.measurementItem}>
          <View style={[styles.measurementIcon, { backgroundColor: '#E8F5E9' }]}>
            <MaterialIcons name="radio-button-checked" size={24} color="#388E3C" />
          </View>
          <Text style={styles.measurementValue}>{record.head_size} cm</Text>
          <Text style={styles.measurementLabel}>Head Size</Text>
        </View>
      </View>
      {record.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{record.notes}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Growth Tracking</Text>
          </View>
          <LoadingState />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <View style={[styles.header, Platform.OS === 'ios' && styles.headerIOS]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Growth Tracking</Text>
          <View style={styles.headerRight} />
        </View>

        <CustomTabBar />
        
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        <TouchableOpacity
          style={[styles.fab, Platform.OS === 'ios' && styles.fabIOS]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>

        <Modal
          animationType={Platform.OS === 'ios' ? 'slide' : 'none'}
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent={true}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[
                styles.modalContent,
                { minHeight: Platform.OS === 'ios' ? 500 : 450 }
              ]}>
                <Text style={styles.modalTitle}>Add Growth Record</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Height (cm)"
                  keyboardType="decimal-pad"
                  value={newRecord.height}
                  onChangeText={(text) => {
                    if (/^\d*\.?\d*$/.test(text)) {
                      setNewRecord(prev => ({...prev, height: text}));
                    }
                  }}
                  maxLength={5}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg)"
                  keyboardType="decimal-pad"
                  value={newRecord.weight}
                  onChangeText={(text) => {
                    if (/^\d*\.?\d*$/.test(text)) {
                      setNewRecord(prev => ({...prev, weight: text}));
                    }
                  }}
                  maxLength={5}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Head Size (cm)"
                  keyboardType="decimal-pad"
                  value={newRecord.head_size}
                  onChangeText={(text) => {
                    if (/^\d*\.?\d*$/.test(text)) {
                      setNewRecord(prev => ({...prev, head_size: text}));
                    }
                  }}
                  maxLength={5}
                />
                
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {newRecord.date_recorded.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={newRecord.date_recorded}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setNewRecord(prev => ({...prev, date_recorded: selectedDate}));
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
                
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Notes (optional)"
                  multiline
                  value={newRecord.notes}
                  onChangeText={(text) => setNewRecord(prev => ({...prev, notes: text}))}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleAddMeasurement}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
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
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chartContainer: {
    marginHorizontal: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 6 : 3.84,
    elevation: 5,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartIOS: {
    marginHorizontal: -10, // Compensate for iOS padding issues
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#4A90E2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    transform: [{ scale: 1.1 }],
  },
  fabIOS: {
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Platform.OS === 'ios' ? 24 : 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'ios' ? 24 : 20,
    padding: Platform.OS === 'ios' ? 24 : 20,
    width: '100%',
    maxHeight: Platform.OS === 'ios' ? '80%' : '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.25,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 15,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  historyScrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
  },
  chartsScrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
  },
  milestonesScrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
  },
  historySection: {
    flex: 1,
    marginHorizontal: Platform.OS === 'ios' ? 16 : 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    marginLeft: Platform.OS === 'ios' ? 4 : 0,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 16,
    padding: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 1,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.08,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: 3,
  },
  historyCardHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  measurementsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 80,
    marginHorizontal: 10,
  },
  measurementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  milestonesSection: {
    marginBottom: 20,
  },
  tabBarWrapper: {
    backgroundColor: 'white',
    marginHorizontal: Platform.OS === 'ios' ? 20 : 16,
    marginVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 3,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
    zIndex: 1,
  },
  tabBar: {
    backgroundColor: 'white',
    elevation: 0,
    shadowOpacity: 0,
    height: Platform.OS === 'ios' ? 56 : 48,
    borderRadius: 12,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'ios' ? 10 : 8,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  indicator: {
    backgroundColor: '#4A90E2',
    height: 3,
    borderRadius: 1.5,
    zIndex: 2,
  },
  tabView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIOS: {
    paddingTop: 8,
    height: 60,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyStateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: Platform.OS === 'ios' ? 20 : 16,
    marginHorizontal: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 1,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 6 : 1.41,
  },
  milestoneAgeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  milestoneItem: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    marginRight: 12,
  },
  milestoneText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  milestoneTextCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  sceneContainer: {
    backgroundColor: 'transparent',
  },
  pagerIOS: {
    overflow: 'visible',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chartsScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chartsScrollContent: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#F5F8FF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 4,
  },
  activeTabButtonText: {
    color: '#4A90E2',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default GrowthTrackingScreen; 