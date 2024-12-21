import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const BabyBirthScreen = ({ navigation, route }) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { babyName, gender } = route.params;

  // Generate arrays for picker items
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleNext = () => {
    // Validate date is not in future
    if (date > new Date()) {
      Alert.alert('Invalid Date', 'Birth date cannot be in the future');
      return;
    }

    navigation.navigate('BabyMeasurements', {
      babyName,
      gender,
      birthDate: date
    });
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '66.66%' }]} />
              </View>
              <Text style={styles.stepText}>Step 2 of 3</Text>
            </View>

            <Text style={styles.title}>When was your baby born?</Text>

            {/* Date Button */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#4A90E2" />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>

            {/* Custom Date Picker Modal */}
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Birth Date</Text>
                    <TouchableOpacity 
                      onPress={() => setShowPicker(false)}
                      style={styles.closeButton}
                    >
                      <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    {/* Month Picker */}
                    <ScrollView style={styles.pickerColumn}>
                      {months.map((month) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.pickerItem,
                            date.getMonth() === month && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            const newDate = new Date(date);
                            newDate.setMonth(month);
                            setDate(newDate);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            date.getMonth() === month && styles.pickerItemTextSelected
                          ]}>
                            {new Date(2000, month).toLocaleString('default', { month: 'long' })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Day Picker */}
                    <ScrollView style={styles.pickerColumn}>
                      {days.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.pickerItem,
                            date.getDate() === day && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            const newDate = new Date(date);
                            newDate.setDate(day);
                            setDate(newDate);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            date.getDate() === day && styles.pickerItemTextSelected
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Year Picker */}
                    <ScrollView style={styles.pickerColumn}>
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerItem,
                            date.getFullYear() === year && styles.pickerItemSelected
                          ]}
                          onPress={() => {
                            const newDate = new Date(date);
                            newDate.setFullYear(year);
                            setDate(newDate);
                          }}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            date.getFullYear() === year && styles.pickerItemTextSelected
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 20 : 0,
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  stepText: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#E8F5FF',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BabyBirthScreen; 