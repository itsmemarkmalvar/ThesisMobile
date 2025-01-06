import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StatusBar
} from 'react-native';
import { Icon } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicineService } from '../services/MedicineService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';

const FREQUENCIES = [
    'Daily',
    'Weekly',
    'Monthly',
    'As needed'
];

const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

const AddMedicineScheduleScreen = ({ route, navigation }) => {
    const { medicineId } = route.params;
    const [time, setTime] = useState(new Date());
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);

    const handleTimeConfirm = (selectedTime) => {
        setTimePickerVisible(false);
        if (selectedTime) {
            const newTime = new Date();
            newTime.setHours(selectedTime.getHours());
            newTime.setMinutes(selectedTime.getMinutes());
            newTime.setSeconds(0);
            newTime.setMilliseconds(0);
            setTime(newTime);
        }
    };

    const handleSave = async () => {
        if (!dosage.trim()) {
            Alert.alert('Error', 'Please enter the dosage');
            return;
        }

        if (!frequency) {
            Alert.alert('Error', 'Please select the frequency');
            return;
        }

        if (frequency === 'weekly' && selectedDays.length === 0) {
            Alert.alert('Error', 'Please select at least one day of the week');
            return;
        }

        try {
            setLoading(true);
            const formattedTime = format(time, 'HH:mm');

            const scheduleData = {
                time: formattedTime,
                dosage: dosage.trim(),
                frequency: frequency.toLowerCase(),
                days_of_week: frequency === 'weekly' ? selectedDays.join(', ') : null,
                notes: notes.trim()
            };

            await MedicineService.createSchedule(medicineId, scheduleData);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving schedule:', error);
            const errorMessage = error.response?.data?.errors?.time?.[0] || 
                               error.response?.data?.message || 
                               'Failed to save schedule';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleDaySelection = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={[styles.header, { marginTop: StatusBar.currentHeight || 44 }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#2E3A59" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Schedule</Text>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Time *</Text>
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setTimePickerVisible(true)}
                        >
                            <Text style={styles.timeButtonText}>
                                {format(time, 'h:mm a')}
                            </Text>
                            <Icon name="access-time" size={20} color="#8F9BB3" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dosage *</Text>
                        <TextInput
                            style={styles.input}
                            value={dosage}
                            onChangeText={setDosage}
                            placeholder="e.g., 1 tablet, 5ml"
                            placeholderTextColor="#8F9BB3"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Frequency *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={frequency}
                                onValueChange={setFrequency}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select frequency" value="" />
                                {FREQUENCIES.map((freq) => (
                                    <Picker.Item
                                        key={freq}
                                        label={freq}
                                        value={freq.toLowerCase()}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {frequency === 'weekly' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Days of Week *</Text>
                            <View style={styles.daysContainer}>
                                {DAYS_OF_WEEK.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.dayButton,
                                            selectedDays.includes(day) && styles.dayButtonSelected
                                        ]}
                                        onPress={() => toggleDaySelection(day)}
                                    >
                                        <Text style={[
                                            styles.dayButtonText,
                                            selectedDays.includes(day) && styles.dayButtonTextSelected
                                        ]}>
                                            {day.slice(0, 3)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Enter additional notes"
                            placeholderTextColor="#8F9BB3"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save Schedule'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <DateTimePickerModal
                    isVisible={timePickerVisible}
                    mode="time"
                    onConfirm={handleTimeConfirm}
                    onCancel={() => setTimePickerVisible(false)}
                />
            </LinearGradient>
        </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent'
    },
    backButton: {
        padding: 8,
        marginRight: 8,
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
        flex: 1
    },
    content: {
        flex: 1,
        padding: 16
    },
    formGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2E3A59',
        marginBottom: 8
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
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    timeButtonText: {
        fontSize: 16,
        color: '#2E3A59'
    },
    pickerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    picker: {
        height: 50,
        width: '100%'
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4
    },
    dayButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#E4E9F2',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    dayButtonSelected: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2'
    },
    dayButtonText: {
        fontSize: 14,
        color: '#2E3A59',
        fontWeight: '500'
    },
    dayButtonTextSelected: {
        color: '#FFFFFF'
    },
    saveButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    saveButtonDisabled: {
        opacity: 0.7
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600'
    }
});

export default AddMedicineScheduleScreen; 