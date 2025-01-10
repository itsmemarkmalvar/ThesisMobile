import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch
} from 'react-native';
import { Button, Input } from '@rneui/themed';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { SleepService } from '../services/SleepService';
import { useBaby } from '../context/BabyContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { validateSleepDuration, validateSleepTime } from '../utils/dateUtils';

const AddSleepScreen = ({ navigation }) => {
    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    const { baby } = useBaby();
    const [loading, setLoading] = useState(false);
    const [sleepData, setSleepData] = useState(() => {
        try {
            const now = new Date();
            const defaultEndTime = new Date(now);
            const defaultStartTime = new Date(now);
            defaultStartTime.setHours(defaultStartTime.getHours() - 1); // Default to 1 hour ago
            
            // Validate the dates
            if (isNaN(defaultStartTime.getTime()) || isNaN(defaultEndTime.getTime())) {
                throw new Error('Invalid default dates');
            }
            
            console.log('Initializing with time:', {
                now: SleepService.formatTimeForDisplay(now),
                defaultStartTime: SleepService.formatTimeForDisplay(defaultStartTime),
                defaultEndTime: SleepService.formatTimeForDisplay(defaultEndTime)
            });
            
            return {
                start_time: defaultStartTime,
                end_time: defaultEndTime,
                is_nap: false,
                quality: 'good',
                location: 'crib',
                notes: ''
            };
        } catch (error) {
            console.error('Error initializing sleep data:', error);
            // Fallback to current time if there's an error
            const fallbackTime = new Date();
            return {
                start_time: fallbackTime,
                end_time: new Date(fallbackTime.getTime() + 60 * 60 * 1000), // 1 hour later
                is_nap: false,
                quality: 'good',
                location: 'crib',
                notes: ''
            };
        }
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [error, setError] = useState('');

    const validateDates = (start, end) => {
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'Invalid date values';
        }
        if (end <= start) {
            return 'End time must be after start time';
        }
        return null;
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // Validate dates
            const dateError = validateDates(sleepData.start_time, sleepData.end_time);
            if (dateError) {
                setError(dateError);
                return;
            }

            // Validate sleep duration based on type (nap or night sleep)
            const durationValidation = validateSleepDuration(
                sleepData.start_time,
                sleepData.end_time,
                sleepData.is_nap
            );

            if (!durationValidation.isValid) {
                setError(durationValidation.error);
                return;
            }

            // Validate that sleep times are not in the future
            const timeValidation = validateSleepTime(
                sleepData.start_time,
                sleepData.end_time
            );

            if (!timeValidation.isValid) {
                setError(timeValidation.error);
                return;
            }

            console.log('⏰ Creating sleep log:', {
                start_time: SleepService.formatTimeForDisplay(sleepData.start_time),
                end_time: SleepService.formatTimeForDisplay(sleepData.end_time),
                duration: `${Math.round((sleepData.end_time - sleepData.start_time) / (1000 * 60))} minutes`
            });

            await SleepService.createSleepLog(sleepData);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving sleep log:', error);
            setError(error.message || 'Failed to save sleep log. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTimeConfirm = (date) => {
        try {
            if (!date || isNaN(date.getTime())) {
                throw new Error('Invalid start time selected');
            }

            console.log('Start time selected:', {
                selected: SleepService.formatTimeForDisplay(date)
            });
            
            setSleepData(prev => {
                // Ensure end time is after start time
                const newEndTime = prev.end_time < date ? new Date(date.getTime() + 60 * 60 * 1000) : prev.end_time;
                return { ...prev, start_time: date, end_time: newEndTime };
            });
        } catch (error) {
            console.error('Error setting start time:', error);
            setError('Invalid start time selected');
        } finally {
            setShowStartPicker(false);
        }
    };

    const handleEndTimeConfirm = (date) => {
        try {
            if (!date || isNaN(date.getTime())) {
                throw new Error('Invalid end time selected');
            }

            console.log('End time selected:', {
                selected: SleepService.formatTimeForDisplay(date)
            });
            
            setSleepData(prev => ({ ...prev, end_time: date }));
        } catch (error) {
            console.error('Error setting end time:', error);
            setError('Invalid end time selected');
        } finally {
            setShowEndPicker(false);
        }
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
                    <Text style={styles.headerTitle}>Add Sleep Log</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView style={styles.scrollView}>
                    <View style={styles.form}>
                        <View style={styles.card}>
                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>Is this a nap?</Text>
                                <Switch
                                    value={sleepData.is_nap}
                                    onValueChange={(value) =>
                                        setSleepData(prev => ({ ...prev, is_nap: value }))
                                    }
                                    trackColor={{ false: '#E4E9F2', true: '#4A90E2' }}
                                    thumbColor={sleepData.is_nap ? '#FFFFFF' : '#FFFFFF'}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Text style={styles.label}>Start Time</Text>
                                <Text style={styles.dateText}>
                                    {SleepService.formatTimeForDisplay(sleepData.start_time)}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Text style={styles.label}>End Time</Text>
                                <Text style={styles.dateText}>
                                    {SleepService.formatTimeForDisplay(sleepData.end_time)}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.label}>Quality</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={sleepData.quality}
                                        onValueChange={(value) =>
                                            setSleepData(prev => ({ ...prev, quality: value }))
                                        }
                                        style={styles.picker}
                                    >
                                        {SleepService.getSleepQualityOptions().map(option => (
                                            <Picker.Item
                                                key={option.value}
                                                label={option.label}
                                                value={option.value}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.label}>Location</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={sleepData.location}
                                        onValueChange={(value) =>
                                            setSleepData(prev => ({ ...prev, location: value }))
                                        }
                                        style={styles.picker}
                                    >
                                        {SleepService.getSleepLocationOptions().map(option => (
                                            <Picker.Item
                                                key={option.value}
                                                label={option.label}
                                                value={option.value}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Notes</Text>
                                <Input
                                    value={sleepData.notes}
                                    onChangeText={(text) =>
                                        setSleepData(prev => ({ ...prev, notes: text }))
                                    }
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Add any notes about this sleep session..."
                                    containerStyle={styles.notesInput}
                                    inputContainerStyle={styles.notesInputContainer}
                                />
                            </View>

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Button
                                title="Save Sleep Log"
                                onPress={handleSave}
                                loading={loading}
                                containerStyle={styles.button}
                                buttonStyle={styles.buttonStyle}
                            />
                        </View>
                    </View>
                </ScrollView>

                <DateTimePickerModal
                    isVisible={showStartPicker}
                    mode="datetime"
                    onConfirm={handleStartTimeConfirm}
                    onCancel={() => setShowStartPicker(false)}
                    date={sleepData.start_time}
                    is24Hour={false}
                />

                <DateTimePickerModal
                    isVisible={showEndPicker}
                    mode="datetime"
                    onConfirm={handleEndTimeConfirm}
                    onCancel={() => setShowEndPicker(false)}
                    date={sleepData.end_time}
                    is24Hour={false}
                    minimumDate={sleepData.start_time}
                />
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
    scrollView: {
        flex: 1
    },
    form: {
        padding: 16
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10
    },
    dateButton: {
        padding: 10,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    label: {
        fontSize: 16,
        color: '#2E3A59',
        marginBottom: 5,
        fontWeight: '500'
    },
    dateText: {
        fontSize: 16,
        color: '#2E3A59'
    },
    pickerContainer: {
        marginBottom: 20
    },
    pickerWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        marginTop: 5
    },
    picker: {
        marginTop: 5
    },
    inputContainer: {
        marginBottom: 20
    },
    notesInput: {
        paddingHorizontal: 0
    },
    notesInputContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        paddingHorizontal: 10
    },
    button: {
        marginTop: 20
    },
    buttonStyle: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingVertical: 12
    },
    error: {
        color: '#FF3D71',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 8
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
    headerRight: {
        width: 40
    }
});

export default AddSleepScreen; 