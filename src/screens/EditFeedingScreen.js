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
        colors={['#FF9A9E', '#FAD0C4', '#FFF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Feeding</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={loading}
            >
              <MaterialIcons name="delete" size={24} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.saveButton]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialIcons name="check" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
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
              style={[
                styles.input,
                validationErrors.duration && styles.inputError
              ]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Enter duration in minutes"
            />
            {renderError('duration')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                validationErrors.notes && styles.inputError
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              multiline
            />
            {renderError('notes')}
          </View>

          <View style={styles.reminderSection}>
            <View style={styles.reminderHeader}>
              <MaterialIcons name="notifications" size={24} color="#4A90E2" />
              <Text style={styles.reminderTitle}>Feeding Reminder</Text>
            </View>
            <View style={styles.reminderToggle}>
              <Text style={styles.reminderText}>
                Remind me for next feeding
              </Text>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                trackColor={{ false: '#767577', true: '#4A90E2' }}
                thumbColor={enableReminder ? '#FFF' : '#f4f3f4'}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  typeButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  sideButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sideButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sideButtonActive: {
    backgroundColor: '#4A90E2',
  },
  sideButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  sideButtonTextActive: {
    color: '#FFF',
  },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  reminderSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  reminderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#666',
  },
  reminderInfo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default EditFeedingScreen; 