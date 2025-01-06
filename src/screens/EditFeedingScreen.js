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
import { format, parseISO } from 'date-fns';
import NotificationService from '../services/NotificationService';
import { validateFeedingData } from '../utils/FeedingValidation';

const EditFeedingScreen = ({ navigation, route }) => {
  const { feedingLog } = route.params;
  const [type, setType] = useState(feedingLog.type);
  const [startTime, setStartTime] = useState(parseISO(feedingLog.start_time));
  const [duration, setDuration] = useState(feedingLog.duration?.toString() || '');
  const [amount, setAmount] = useState(feedingLog.amount?.toString() || '');
  const [breastSide, setBreastSide] = useState(feedingLog.breast_side || 'left');
  const [foodType, setFoodType] = useState(feedingLog.food_type || '');
  const [notes, setNotes] = useState(feedingLog.notes || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [enableReminder, setEnableReminder] = useState(true);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setValidationErrors({});

      const feedingData = {
        type,
        start_time: startTime,
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

      const formattedData = FeedingService.formatFeedingData(type, startTime, {
        duration: duration ? parseInt(duration) : null,
        amount: amount ? parseFloat(amount) : null,
        breastSide,
        foodType,
        notes
      });

      await FeedingService.updateFeedingLog(feedingLog.id, formattedData);

      // Update reminder if enabled
      if (enableReminder) {
        try {
          await NotificationService.scheduleFeedingReminder(startTime, type);
        } catch (notificationError) {
          console.error('Failed to schedule reminder:', notificationError);
        }
      } else {
        await NotificationService.cancelFeedingReminders();
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error updating feeding log:', error);
      Alert.alert('Error', 'Failed to update feeding log');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Feeding Log',
      'Are you sure you want to delete this feeding log?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await FeedingService.deleteFeedingLog(feedingLog.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting feeding log:', error);
              Alert.alert('Error', 'Failed to delete feeding log');
              setLoading(false);
            }
          }
        }
      ]
    );
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

  const renderError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return (
        <Text style={styles.errorText}>{validationErrors[fieldName]}</Text>
      );
    }
    return null;
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
          <Text style={styles.headerTitle}>Edit Feeding</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={loading}
            >
              <MaterialIcons name="delete" size={24} color="#FF3D71" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="check" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
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
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setStartTime(selectedTime);
              }
            }}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
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
  }
});

export default EditFeedingScreen; 