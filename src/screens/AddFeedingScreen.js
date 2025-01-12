import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import FeedingService from '../services/FeedingService';
import NotificationService from '../services/NotificationService';
import { validateFeedingData } from '../utils/FeedingValidation';
import { format } from 'date-fns';
import { DateTimeService } from '../services/DateTimeService';

const AddFeedingScreen = ({ navigation }) => {
  const [type, setType] = useState('breast');
  const [startTime, setStartTime] = useState(() => {
    // Get current time in Manila timezone
    const now = new Date();
    // Add 8 hours to convert from UTC to Manila time
    return new Date(now.getTime() + (8 * 60 * 60 * 1000));
  });
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [breastSide, setBreastSide] = useState('left');
  const [foodType, setFoodType] = useState('');
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enableReminder, setEnableReminder] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Initialize DateTimeService if not already initialized
    const initializeDateTime = async () => {
      if (!DateTimeService._initialized) {
        await DateTimeService.initialize();
      }
    };
    initializeDateTime();
  }, []);

  const handleTimeChange = (event, selectedTime) => {
    if (event.type === 'set' && selectedTime) {
      console.log('Time selection details:', {
        raw: selectedTime,
        iso: selectedTime.toISOString(),
        local: selectedTime.toLocaleTimeString(),
        hours: selectedTime.getHours(),
        minutes: selectedTime.getMinutes(),
        timezone: DateTimeService._currentTimezone || 'Asia/Manila'
      });

      // Store the selected time directly without conversion
      setStartTime(selectedTime);
      
      // Log the time that will be displayed
      console.log('Time display details:', {
        storedTime: selectedTime.toISOString(),
        displayFormat: format(selectedTime, 'h:mm a'),
        timezone: DateTimeService._currentTimezone || 'Asia/Manila'
      });
    }
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setValidationErrors({});

      // Convert Manila time to UTC by subtracting 8 hours
      const utcTime = new Date(startTime.getTime() - (8 * 60 * 60 * 1000));
      
      console.log('Saving feeding log:', {
        selectedManilaTime: startTime.toISOString(), // Original Manila time
        convertedUTCTime: utcTime.toISOString(),     // Converted UTC time
        timezone: DateTimeService._currentTimezone
      });

      const feedingData = {
        type,
        start_time: utcTime,  // Save in UTC
        duration: duration || null,
        amount: amount || null,
        breast_side: type === 'breast' ? breastSide : null,
        food_type: type === 'solid' ? foodType : null,
        notes: notes || null
      };

      // Validate data
      const { isValid, errors } = validateFeedingData(type, feedingData);
      if (!isValid) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }

      // Save feeding log
      const formattedData = FeedingService.formatFeedingData(type, utcTime, {
        duration: duration ? parseInt(duration) : null,
        amount: amount ? parseFloat(amount) : null,
        breastSide,
        foodType,
        notes
      });

      const savedLog = await FeedingService.createFeedingLog(formattedData);

      // Schedule next feeding reminder if enabled
      if (enableReminder) {
        try {
          await NotificationService.scheduleFeedingReminder(startTime, type);
        } catch (notificationError) {
          console.error('Failed to schedule reminder:', notificationError);
          // Don't block saving just because reminder failed
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving feeding log:', error);
      Alert.alert('Error', 'Failed to save feeding log');
    } finally {
      setLoading(false);
    }
  };

  const renderError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return (
        <Text style={styles.errorText}>{validationErrors[fieldName]}</Text>
      );
    }
    return null;
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Feeding Type</Text>
      <View style={styles.typeButtons}>
        {['breast', 'bottle', 'solid'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeButton,
              type === t && styles.typeButtonActive
            ]}
            onPress={() => setType(t)}
          >
            <MaterialIcons
              name={
                t === 'breast' ? 'child-care' :
                t === 'bottle' ? 'local-drink' : 'restaurant'
              }
              size={24}
              color={type === t ? '#FFF' : '#4A90E2'}
            />
            <Text style={[
              styles.typeButtonText,
              type === t && styles.typeButtonTextActive
            ]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Time</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowTimePicker(true)}
      >
        <MaterialIcons name="access-time" size={24} color="#4A90E2" />
        <Text style={styles.timeText}>
          {format(startTime, 'h:mm a')}
        </Text>
      </TouchableOpacity>
      <Text style={styles.timezoneInfo}>Times are shown in {DateTimeService._currentTimezone || 'Asia/Manila'}</Text>
    </View>
  );

  const renderBreastFeedingInputs = () => {
    if (type !== 'breast') return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breast Side</Text>
        <View style={styles.sideButtons}>
          {['left', 'right', 'both'].map((side) => (
            <TouchableOpacity
              key={side}
              style={[
                styles.sideButton,
                breastSide === side && styles.sideButtonActive
              ]}
              onPress={() => setBreastSide(side)}
            >
              <Text style={[
                styles.sideButtonText,
                breastSide === side && styles.sideButtonTextActive
              ]}>
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBottleInputs = () => {
    if (type !== 'bottle') return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount (ml)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount in ml"
        />
      </View>
    );
  };

  const renderSolidInputs = () => {
    if (type !== 'solid') return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Type</Text>
        <TextInput
          style={styles.input}
          value={foodType}
          onChangeText={setFoodType}
          placeholder="Enter food type"
        />
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Add Feeding</Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="check" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderTypeSelector()}
          {renderError('type')}

          {renderTimeSelector()}
          {renderError('start_time')}

          {renderBreastFeedingInputs()}
          {renderError('breast_side')}

          {renderBottleInputs()}
          {renderError('amount')}

          {renderSolidInputs()}
          {renderError('food_type')}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Enter duration"
              placeholderTextColor="#8F9BB3"
            />
            {renderError('duration')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes"
              placeholderTextColor="#8F9BB3"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <MaterialIcons name="notifications" size={20} color="#4A90E2" />
                <Text style={styles.reminderTitle}>Feeding Reminder</Text>
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderLabel}>Remind me for next feeding</Text>
                <Switch
                  value={enableReminder}
                  onValueChange={setEnableReminder}
                  trackColor={{ false: '#E4E9F2', true: '#4A90E2' }}
                  thumbColor={enableReminder ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
              {enableReminder && (
                <Text style={styles.reminderInfo}>
                  You'll be reminded {
                    type === 'breast' ? '2 hours' :
                    type === 'bottle' ? '3 hours' : '4 hours'
                  } after this feeding
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {showTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E3A59',
    flex: 1,
    marginLeft: 16
  },
  saveButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  content: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 12
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  typeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2'
  },
  typeButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500'
  },
  typeButtonTextActive: {
    color: '#FFFFFF'
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  timeText: {
    fontSize: 16,
    color: '#2E3A59'
  },
  sideButtons: {
    flexDirection: 'row',
    gap: 12
  },
  sideButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  sideButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2'
  },
  sideButtonText: {
    fontSize: 16,
    color: '#2E3A59',
    fontWeight: '500'
  },
  sideButtonTextActive: {
    color: '#FFFFFF'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2E3A59',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  reminderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E4E9F2'
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59'
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  reminderLabel: {
    fontSize: 14,
    color: '#2E3A59'
  },
  reminderInfo: {
    fontSize: 14,
    color: '#8F9BB3',
    fontStyle: 'italic'
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 14,
    marginTop: 4
  },
  timezoneInfo: {
    fontSize: 14,
    color: '#8F9BB3',
    fontStyle: 'italic'
  }
});

export default AddFeedingScreen; 