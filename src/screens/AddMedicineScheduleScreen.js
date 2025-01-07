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
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'As Needed', value: 'as_needed' }
];

const DAYS_OF_WEEK = [
    { name: 'Sunday', value: 1 },
    { name: 'Monday', value: 2 },
    { name: 'Tuesday', value: 3 },
    { name: 'Wednesday', value: 4 },
    { name: 'Thursday', value: 5 },
    { name: 'Friday', value: 6 },
    { name: 'Saturday', value: 7 }
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
            setTime(selectedTime);
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
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            const validDays = frequency === 'weekly' 
                ? selectedDays
                    .map(Number)
                    .filter(day => !isNaN(day) && day >= 1 && day <= 7)
                : null;

            const scheduleData = {
                time: formattedTime,
                dosage: dosage.trim(),
                frequency: frequency.toLowerCase(),
                days_of_week: validDays,
                notes: notes.trim()
            };

            console.log('Creating schedule with data:', scheduleData);
            await MedicineService.createSchedule(medicineId, scheduleData);
            navigation.goBack();
        } catch (error) {
            console.error('Error creating schedule:', error);
            if (error.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
                const errorMessages = Object.values(error.response.data.errors)
                    .flat()
                    .join('\n');
                Alert.alert('Validation Error', errorMessages);
            } else {
                Alert.alert('Error', 'Failed to save schedule');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleDaySelection = (day) => {
        const dayValue = Number(day.value);
        if (isNaN(dayValue) || dayValue < 1 || dayValue > 7) {
            return;
        }

        setSelectedDays(prevDays => {
            const currentDays = prevDays.map(Number).filter(d => !isNaN(d) && d >= 1 && d <= 7);
            return currentDays.includes(dayValue)
                ? currentDays.filter(d => d !== dayValue)
                : [...currentDays, dayValue];
        });
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
                                        key={freq.value}
                                        label={freq.label}
                                        value={freq.value}
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
                                        key={day.name}
                                        style={[
                                            styles.dayButton,
                                            selectedDays.includes(day.value) && styles.dayButtonSelected
                                        ]}
                                        onPress={() => toggleDaySelection(day)}
                                    >
                                        <Text style={[
                                            styles.dayButtonText,
                                            selectedDays.includes(day.value) && styles.dayButtonTextSelected
                                        ]}>
                                            {day.name.slice(0, 3)}
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