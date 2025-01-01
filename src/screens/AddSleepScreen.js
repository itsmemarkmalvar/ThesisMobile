import React, { useState } from 'react';
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

const AddSleepScreen = ({ navigation }) => {
    const { baby } = useBaby();
    const [loading, setLoading] = useState(false);
    const [sleepData, setSleepData] = useState({
        start_time: new Date(),
        end_time: new Date(),
        is_nap: false,
        quality: 'good',
        location: 'crib',
        notes: ''
    });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // Validate times
            if (sleepData.end_time <= sleepData.start_time) {
                setError('End time must be after start time');
                return;
            }

            await SleepService.createSleepLog(sleepData);
            navigation.goBack();
        } catch (error) {
            setError('Failed to save sleep log. Please try again.');
            console.error('Error saving sleep log:', error);
        } finally {
            setLoading(false);
        }
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
                    title="Save Sleep Log"
                    onPress={handleSave}
                    loading={loading}
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
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10
    }
});

export default AddSleepScreen; 