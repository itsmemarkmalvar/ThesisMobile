import React, { useState } from 'react';
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

const EditSleepScreen = ({ route, navigation }) => {
    const { sleepLog } = route.params;
    const [loading, setLoading] = useState(false);
    const [sleepData, setSleepData] = useState({
        start_time: new Date(sleepLog.start_time),
        end_time: new Date(sleepLog.end_time),
        is_nap: sleepLog.is_nap,
        quality: sleepLog.quality || 'good',
        location: sleepLog.location || 'crib',
        notes: sleepLog.notes || ''
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [error, setError] = useState('');

    const handleUpdate = async () => {
        try {
            setLoading(true);
            setError('');

            // Validate times
            if (sleepData.end_time <= sleepData.start_time) {
                setError('End time must be after start time');
                return;
            }

            await SleepService.updateSleepLog(sleepLog.id, sleepData);
            navigation.goBack();
        } catch (error) {
            setError('Failed to update sleep log. Please try again.');
            console.error('Error updating sleep log:', error);
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
        setSleepData(prev => ({ ...prev, start_time: date }));
        setShowStartPicker(false);
    };

    const handleEndTimeConfirm = (date) => {
        setSleepData(prev => ({ ...prev, end_time: date }));
        setShowEndPicker(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Is this a nap?</Text>
                    <Switch
                        value={sleepData.is_nap}
                        onValueChange={(value) =>
                            setSleepData(prev => ({ ...prev, is_nap: value }))
                        }
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

                <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Location</Text>
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

                <Input
                    label="Notes"
                    value={sleepData.notes}
                    onChangeText={(text) =>
                        setSleepData(prev => ({ ...prev, notes: text }))
                    }
                    multiline
                    numberOfLines={3}
                    placeholder="Add any notes about this sleep session..."
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                    title="Update Sleep Log"
                    onPress={handleUpdate}
                    loading={loading}
                    containerStyle={styles.button}
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    form: {
        padding: 20
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
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
    },
    label: {
        fontSize: 16,
        color: '#86939e',
        marginBottom: 5
    },
    dateText: {
        fontSize: 16,
        color: '#000'
    },
    pickerContainer: {
        marginBottom: 20
    },
    picker: {
        marginTop: 5
    },
    button: {
        marginTop: 20
    },
    deleteButton: {
        borderColor: '#ff0000'
    },
    deleteButtonText: {
        color: '#ff0000'
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10
    }
});

export default EditSleepScreen; 