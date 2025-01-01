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

const MEDICINE_FORMS = [
    'Tablet',
    'Liquid',
    'Capsule',
    'Injection',
    'Drops',
    'Inhaler',
    'Cream',
    'Other'
];

const AddMedicineScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [form, setForm] = useState('');
    const [strength, setStrength] = useState('');
    const [instructions, setInstructions] = useState('');
    const [sideEffects, setSideEffects] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter the medicine name');
            return;
        }

        if (!form) {
            Alert.alert('Error', 'Please select the medicine form');
            return;
        }

        try {
            setLoading(true);
            const medicineData = {
                name: name.trim(),
                form,
                strength: strength.trim(),
                instructions: instructions.trim(),
                side_effects: sideEffects.trim(),
                start_date: startDate,
                end_date: endDate,
                notes: notes.trim()
            };

            await MedicineService.createMedicine(medicineData);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving medicine:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to save medicine'
            );
        } finally {
            setLoading(false);
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
                    <Text style={styles.headerTitle}>Add Medicine</Text>
                </View>
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Medicine Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter medicine name"
                            placeholderTextColor="#8F9BB3"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Form *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={form}
                                onValueChange={setForm}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select form" value="" />
                                {MEDICINE_FORMS.map((form) => (
                                    <Picker.Item key={form} label={form} value={form.toLowerCase()} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Strength</Text>
                        <TextInput
                            style={styles.input}
                            value={strength}
                            onChangeText={setStrength}
                            placeholder="e.g., 500mg, 5ml"
                            placeholderTextColor="#8F9BB3"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Instructions</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={instructions}
                            onChangeText={setInstructions}
                            placeholder="Enter instructions"
                            placeholderTextColor="#8F9BB3"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Side Effects</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={sideEffects}
                            onChangeText={setSideEffects}
                            placeholder="Enter possible side effects"
                            placeholderTextColor="#8F9BB3"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Start Date *</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setStartDatePickerVisible(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                {format(startDate, 'MMM d, yyyy')}
                            </Text>
                            <Icon name="calendar-today" size={20} color="#8F9BB3" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>End Date (Optional)</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setEndDatePickerVisible(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                {endDate ? format(endDate, 'MMM d, yyyy') : 'Not set'}
                            </Text>
                            <Icon name="calendar-today" size={20} color="#8F9BB3" />
                        </TouchableOpacity>
                    </View>

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
                            {loading ? 'Saving...' : 'Save Medicine'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <DateTimePickerModal
                    isVisible={isStartDatePickerVisible}
                    mode="date"
                    onConfirm={(date) => {
                        setStartDate(date);
                        setStartDatePickerVisible(false);
                    }}
                    onCancel={() => setStartDatePickerVisible(false)}
                />

                <DateTimePickerModal
                    isVisible={isEndDatePickerVisible}
                    mode="date"
                    onConfirm={(date) => {
                        setEndDate(date);
                        setEndDatePickerVisible(false);
                    }}
                    onCancel={() => setEndDatePickerVisible(false)}
                    minimumDate={startDate}
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    dateButtonText: {
        fontSize: 16,
        color: '#2E3A59'
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

export default AddMedicineScreen; 