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

const initialLayout = { width: 320 };

const GrowthTrackingScreen = ({ navigation, route }) => {
  const { updateBabyData } = useBaby();
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
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { 
      key: 'history', 
      title: 'History',
      icon: 'history' 
    },
    { 
      key: 'charts', 
      title: 'Charts',
      icon: 'insert-chart' 
    },
    { 
      key: 'milestones', 
      title: 'Milestones',
      icon: 'emoji-events'
    },
  ]);

  const tabPosition = useSharedValue(0);
  const sceneAnimation = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(tabPosition.value * (initialLayout.width / 3)) }],
      width: initialLayout.width / 3,
    };
  });

  const [milestones, setMilestones] = useState([
    {
      id: 1,
      age: '0-3 months',
      milestones: [
        { id: 1, title: 'Lifts head during tummy time', completed: false },
        { id: 2, title: 'Follows moving objects with eyes', completed: false },
        { id: 3, title: 'Recognizes familiar faces', completed: false },
      ]
    },
    {
      id: 2,
      age: '4-6 months',
      milestones: [
        { id: 4, title: 'Rolls over in both directions', completed: false },
        { id: 5, title: 'Begins to sit without support', completed: false },
        { id: 6, title: 'Responds to own name', completed: false },
      ]
    },
    {
      id: 3,
      age: '7-9 months',
      milestones: [
        { id: 7, title: 'Stands holding on', completed: false },
        { id: 8, title: 'Can get into sitting position', completed: false },
        { id: 9, title: 'Learns to crawl', completed: false },
      ]
    },
    {
      id: 4,
      age: '10-12 months',
      milestones: [
        { id: 10, title: 'Pulls up to stand', completed: false },
        { id: 11, title: 'Walks holding on to furniture', completed: false },
        { id: 12, title: 'Says first words', completed: false },
      ]
    }
  ]);

  const toggleMilestone = (ageGroupId, milestoneId) => {
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
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  useEffect(() => {
    if (route.params?.initialTab) {
      const tabIndex = routes.findIndex(r => r.key === route.params.initialTab);
      if (tabIndex !== -1) {
        setIndex(tabIndex);
      }
    }
  }, [route.params?.initialTab]);

  const fetchGrowthData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      console.log('Fetching growth data...');
      const response = await axios.get(`${API_URL}/growth/charts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Growth data received:', response.data);
      setGrowthData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching growth data:', error);
      Alert.alert('Error', 'Failed to load growth data');
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
        height,
        weight,
        head_size: headSize,
        date_recorded: newRecord.date_recorded.toISOString().split('T')[0],
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
        // Update local state
        setGrowthData(prevData => [response.data.data, ...prevData]);
        // Update baby data with latest measurements
        updateBabyData({
          height,
          weight,
          head_size: headSize,
        });
        setModalVisible(false);
        // Clear form
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

  const renderChart = (data, title, unit) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    // Debug log to check data structure
    console.log('Chart data:', data);

    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    const chartData = {
      labels: sortedData.map(d => {
        try {
          const date = new Date(d.date);
          if (isNaN(date.getTime())) {
            console.log('Invalid date:', d.date);
            return '';
          }
          return `${date.getMonth() + 1}/${date.getDate()}`;
        } catch (error) {
          console.error('Date parsing error:', error);
          return '';
        }
      }),
      datasets: [{
        data: sortedData.map(d => {
          const value = Number(d[unit.toLowerCase()]);
          if (isNaN(value)) {
            console.log('Invalid value for', unit, ':', d[unit.toLowerCase()]);
            return 0;
          }
          return value;
        })
      }]
    };

    // Debug log to check processed chart data
    console.log('Processed chart data:', chartData);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={chartData}
          width={350}
          height={220}
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
              r: '6',
              strokeWidth: '2',
              stroke: '#4A90E2'
            }
          }}
          bezier
          style={styles.chart}
        />
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

  const renderHistoryTab = () => {
    if (loading) return <LoadingState />;
    
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
        style={styles.tabContent}
      >
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Growth History</Text>
          {growthData.map((record, index) => renderHistoryCard(record, index))}
        </View>
      </ScrollView>
    );
  };

  const renderHistoryCard = (record, index) => (
    <View key={index} style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={20} color="#666" />
          <Text style={styles.dateText}>
            {new Date(record.date).toLocaleDateString()}
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
            <MaterialIcons name="fitness-center" size={24} color="#F57C00" />
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

  const renderChartsTab = () => (
    <ScrollView style={styles.tabContent}>
      {renderChart(growthData, 'Height Progress (cm)', 'height')}
      {renderChart(growthData, 'Weight Progress (kg)', 'weight')}
      {renderChart(growthData, 'Head Size Progress (cm)', 'head_size')}
    </ScrollView>
  );

  const renderMilestonesTab = () => (
    <ScrollView style={styles.tabContent}>
      {milestones.map((ageGroup) => (
        <View key={ageGroup.id} style={styles.milestoneGroup}>
          <Text style={styles.milestoneAgeTitle}>{ageGroup.age}</Text>
          {ageGroup.milestones.map((milestone) => (
            <TouchableOpacity
              key={milestone.id}
              style={styles.milestoneItem}
              onPress={() => toggleMilestone(ageGroup.id, milestone.id)}
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
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderScene = SceneMap({
    history: renderHistoryTab,
    charts: renderChartsTab,
    milestones: renderMilestonesTab,
  });

  const renderTabBar = props => (
    <View style={styles.tabBarWrapper}>
      <TabBar
        {...props}
        style={styles.tabBar}
        indicatorStyle={styles.indicator}
        activeColor="#4A90E2"
        inactiveColor="#666666"
        renderLabel={({ route, focused, color }) => (
          <View style={styles.tabLabelContainer}>
            <MaterialIcons
              name={route.icon}
              size={24}
              color={focused ? '#4A90E2' : '#666666'}
              style={styles.tabIcon}
            />
            <Text style={[
              styles.tabLabelText,
              { color: focused ? '#4A90E2' : '#666666' }
            ]}>
              {route.title}
            </Text>
          </View>
        )}
      />
    </View>
  );

  const handleIndexChange = (newIndex) => {
    setIndex(newIndex);
  };

  useEffect(() => {
    // Update tab position when index changes from outside (e.g., navigation params)
    tabPosition.value = withSpring(index * (initialLayout.width / 3));
  }, [index]);

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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Growth Tracking</Text>
          <View style={styles.headerRight} />
        </View>

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: 320 }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>

        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent={true}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContent, { minHeight: 450 }]}>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
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
    paddingTop: 20,
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tabBar: {
    backgroundColor: 'white',
    elevation: 0,
    shadowOpacity: 0,
    height: 48,
    borderRadius: 12,
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
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
  },
  tabView: {
    backgroundColor: 'transparent',
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
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
    paddingVertical: 12,
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
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabelText: {
    marginLeft: 8,
  },
});

export default GrowthTrackingScreen; 