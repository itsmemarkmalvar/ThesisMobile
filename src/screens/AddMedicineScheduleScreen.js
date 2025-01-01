import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert
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
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);

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
            const scheduleData = {
                time: format(time, 'HH:mm:ss'),
                dosage: dosage.trim(),
                frequency: frequency.toLowerCase(),
                days_of_week: frequency === 'weekly' ? selectedDays.join(',') : null,
                notes: notes.trim()
            };

            await MedicineService.createSchedule(medicineId, scheduleData);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving schedule:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to save schedule'
            );
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
                colors={['#FF9A9E', '#FAD0C4', '#FFF']}
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
                    isVisible={isTimePickerVisible}
                    mode="time"
                    onConfirm={(selectedTime) => {
                        setTime(selectedTime);
                        setTimePickerVisible(false);
                    }}
                    onCancel={() => setTimePickerVisible(false)}
                />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF9A9E'
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
        borderRadius: 20
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2E3A59'
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
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#2E3A59',
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    timeButtonText: {
        fontSize: 16,
        color: '#2E3A59'
    },
    pickerContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        overflow: 'hidden'
    },
    picker: {
        height: 50,
        width: '100%'
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    dayButtonSelected: {
        backgroundColor: '#FF9A9E',
        borderColor: '#FF9A9E'
    },
    dayButtonText: {
        fontSize: 14,
        color: '#2E3A59'
    },
    dayButtonTextSelected: {
        color: '#FFF'
    },
    saveButton: {
        backgroundColor: '#FF9A9E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40
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