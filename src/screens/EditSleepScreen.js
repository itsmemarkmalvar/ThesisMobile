import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert
} from 'react-native';
import { Button, Input } from '@rneui/themed';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { SleepService } from '../services/SleepService';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { validateSleepDuration, validateSleepTime } from '../utils/dateUtils';

const EditSleepScreen = ({ navigation, route }) => {
    const { sleepLog } = route.params;
    const [loading, setLoading] = useState(false);
    const [sleepData, setSleepData] = useState(() => {
        try {
            // Log the raw incoming data from database
            console.log('Raw sleep log from database:', {
                id: sleepLog.id,
                raw_start: sleepLog.start_time,
                raw_end: sleepLog.end_time,
                is_nap: sleepLog.is_nap,
                quality: sleepLog.quality,
                location: sleepLog.location
            });

            // Convert ISO strings to Date objects
            const startTime = new Date(sleepLog.start_time);
            const endTime = new Date(sleepLog.end_time);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                throw new Error('Invalid time values');
            }

            console.log('Converted times:', {
                start: format(startTime, "yyyy-MM-dd HH:mm:ss"),
                end: format(endTime, "yyyy-MM-dd HH:mm:ss")
            });

            return {
                start_time: startTime,
                end_time: endTime,
                is_nap: sleepLog.is_nap,
                quality: sleepLog.quality || 'good',
                location: sleepLog.location || 'crib',
                notes: sleepLog.notes || ''
            };
        } catch (error) {
            console.error('Error initializing sleep data:', error);
            Alert.alert('Error', 'Failed to load sleep data');
            navigation.goBack();
            return null;
        }
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    const getMaximumAllowedDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        return tomorrow;
    };

    const validateDates = (start, end) => {
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'Invalid date values';
        }
        if (end <= start) {
            return 'End time must be after start time';
        }

        const maxDate = getMaximumAllowedDate();
        if (start > maxDate || end > maxDate) {
            return 'Sleep times cannot be set beyond tomorrow';
        }

        // Check if times are in the future
        const now = new Date();
        if (end > now) {
            return 'Cannot log sleep that ends in the future';
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
                setLoading(false);
                return;
            }

            // Get current time for future validation
            const now = new Date();
            if (sleepData.end_time > now) {
                setError('Cannot log sleep that ends in the future');
                setLoading(false);
                return;
            }

            console.log('⏰ Updating sleep log:', {
                id: sleepLog.id,
                start_time: SleepService.formatTimeForDisplay(sleepData.start_time),
                end_time: SleepService.formatTimeForDisplay(sleepData.end_time),
                duration: `${Math.round((sleepData.end_time - sleepData.start_time) / (1000 * 60))} minutes`,
                currentTime: SleepService.formatTimeForDisplay(now)
            });

            await SleepService.updateSleepLog(sleepLog.id, sleepData);
            navigation.goBack();
        } catch (error) {
            console.error('Error updating sleep log:', error);
            setError(error.message || 'Failed to update sleep log. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Sleep Log',
            'Are you sure you want to delete this sleep log?',
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
                            await SleepService.deleteSleepLog(sleepLog.id);
                            navigation.goBack();
                        } catch (error) {
                            setError('Failed to delete sleep log. Please try again.');
                            console.error('Error deleting sleep log:', error);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleStartTimeConfirm = (date) => {
        try {
            if (!date || isNaN(date.getTime())) {
                throw new Error('Invalid start time selected');
            }

            const now = new Date();
            if (date > now) {
                setError('Cannot select a future start time');
                return;
            }

            const maxDate = getMaximumAllowedDate();
            if (date > maxDate) {
                setError('Cannot select a date beyond tomorrow');
                return;
            }

            console.log('Start time selected:', {
                selected: SleepService.formatTimeForDisplay(date),
                maxAllowed: SleepService.formatTimeForDisplay(maxDate),
                currentTime: SleepService.formatTimeForDisplay(now)
            });
            
            setSleepData(prev => {
                // Ensure end time is after start time but not beyond max date or current time
                let newEndTime = prev.end_time;
                if (prev.end_time < date) {
                    newEndTime = new Date(date.getTime() + 60 * 60 * 1000);
                    if (newEndTime > maxDate) {
                        newEndTime = maxDate;
                    }
                    if (newEndTime > now) {
                        newEndTime = now;
                    }
                }
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

            const now = new Date();
            if (date > now) {
                setError('Cannot select a future end time');
                return;
            }

            const maxDate = getMaximumAllowedDate();
            if (date > maxDate) {
                setError('Cannot select a date beyond tomorrow');
                return;
            }

            console.log('End time selected:', {
                selected: SleepService.formatTimeForDisplay(date),
                maxAllowed: SleepService.formatTimeForDisplay(maxDate),
                currentTime: SleepService.formatTimeForDisplay(now)
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
                    <Text style={styles.headerTitle}>Edit Sleep Log</Text>
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
                                    {format(sleepData.start_time, 'MMM d, yyyy h:mm a')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Text style={styles.label}>End Time</Text>
                                <Text style={styles.dateText}>
                                    {format(sleepData.end_time, 'MMM d, yyyy h:mm a')}
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
                                title="Update Sleep Log"
                                onPress={handleSave}
                                loading={loading}
                                containerStyle={styles.button}
                                buttonStyle={styles.buttonStyle}
                            />

                            <Button
                                title="Delete Sleep Log"
                                onPress={handleDelete}
                                type="outline"
                                buttonStyle={styles.deleteButton}
                                titleStyle={styles.deleteButtonText}
                                containerStyle={styles.button}
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
                />

                <DateTimePickerModal
                    isVisible={showEndPicker}
                    mode="datetime"
                    onConfirm={handleEndTimeConfirm}
                    onCancel={() => setShowEndPicker(false)}
                    date={sleepData.end_time}
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
    deleteButton: {
        borderColor: '#FF3D71',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12
    },
    deleteButtonText: {
        color: '#FF3D71'
    },
    error: {
        color: '#FF3D71',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14
    }
});

export default EditSleepScreen; 