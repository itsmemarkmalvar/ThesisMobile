import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Icon } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicineService } from '../services/MedicineService';
import { format } from 'date-fns';

const MedicineDetailsScreen = ({ route, navigation }) => {
    const { medicine: initialMedicine } = route.params;
    const [medicine, setMedicine] = useState(initialMedicine);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [medicineData, schedulesData] = await Promise.all([
                MedicineService.getMedicine(medicine.id),
                MedicineService.getSchedules(medicine.id)
            ]);

            setMedicine(medicineData);
            setSchedules(schedulesData);
        } catch (error) {
            console.error('Error loading medicine details:', error);
            setError(error.response?.data?.message || 'Failed to load medicine details');
            
            if (error.response?.status === 401) {
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [medicine.id])
    );

    const handleDelete = () => {
        Alert.alert(
            'Delete Medicine',
            'Are you sure you want to delete this medicine? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await MedicineService.deleteMedicine(medicine.id);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting medicine:', error);
                            Alert.alert(
                                'Error',
                                error.response?.data?.message || 'Failed to delete medicine'
                            );
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (timeString) => {
        try {
            // Create a base date for today
            const baseDate = new Date();
            // Split the time string into hours and minutes
            const [hours, minutes] = timeString.split(':');
            // Set the time components
            baseDate.setHours(parseInt(hours, 10));
            baseDate.setMinutes(parseInt(minutes, 10));
            // Format the time
            return format(baseDate, 'h:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString; // Return original string if formatting fails
        }
    };

    const renderSchedule = (schedule) => {
        return (
            <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleContent}>
                    <View style={styles.timeContainer}>
                        <Icon name="access-time" size={18} color="#FF9A9E" />
                        <Text style={styles.scheduleTime}>{formatTime(schedule.time)}</Text>
                    </View>
                    <View style={styles.scheduleDetails}>
                        <Text style={styles.scheduleDosage}>{schedule.dosage}</Text>
                        <Text style={styles.scheduleFrequency}>
                            {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                            {schedule.days_of_week && ` • ${schedule.days_of_week}`}
                        </Text>
                        {schedule.notes && <Text style={styles.scheduleNotes}>{schedule.notes}</Text>}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF9A9E" />
                    </View>
                </LinearGradient>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadData}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Medicine Details</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('EditMedicine', { medicine })}
                        >
                            <Icon name="edit" size={24} color="#2E3A59" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDelete}
                        >
                            <Icon name="delete" size={24} color="#FF3D71" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Card containerStyle={styles.detailsCard}>
                        <View style={styles.medicineHeader}>
                            <View style={styles.medicineInfo}>
                                <Text style={styles.medicineName}>{medicine.name}</Text>
                                <Text style={styles.medicineForm}>
                                    {medicine.form} • {medicine.strength || 'No strength specified'}
                                </Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: medicine.is_active ? '#E8F5E9' : '#FFEBEE' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: medicine.is_active ? '#2E7D32' : '#C62828' }
                                ]}>
                                    {medicine.is_active ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        {medicine.instructions && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Instructions</Text>
                                <Text style={styles.sectionText}>{medicine.instructions}</Text>
                            </View>
                        )}

                        {medicine.side_effects && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Side Effects</Text>
                                <Text style={styles.sectionText}>{medicine.side_effects}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Duration</Text>
                            <Text style={styles.sectionText}>
                                Start: {format(new Date(medicine.start_date), 'MMM d, yyyy')}
                                {medicine.end_date && (
                                    `\nEnd: ${format(new Date(medicine.end_date), 'MMM d, yyyy')}`
                                )}
                            </Text>
                        </View>

                        {medicine.notes && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Notes</Text>
                                <Text style={styles.sectionText}>{medicine.notes}</Text>
                            </View>
                        )}
                    </Card>

                    <Card containerStyle={styles.schedulesCard}>
                        <View style={styles.scheduleHeader}>
                            <Text style={styles.cardTitle}>Schedules</Text>
                            <TouchableOpacity
                                style={styles.addScheduleButton}
                                onPress={() => navigation.navigate('AddMedicineSchedule', { medicineId: medicine.id })}
                            >
                                <Icon name="add" size={24} color="#FF9A9E" />
                            </TouchableOpacity>
                        </View>
                        {schedules.length === 0 ? (
                            <View style={styles.emptySchedules}>
                                <Text style={styles.emptyText}>No schedules added yet</Text>
                                <Text style={styles.emptySubText}>
                                    Add a schedule to start tracking doses
                                </Text>
                            </View>
                        ) : (
                            schedules.map((schedule) => renderSchedule(schedule))
                        )}
                    </Card>
                </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent'
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
    headerActions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    content: {
        flex: 1,
        padding: 16
    },
    detailsCard: {
        borderRadius: 12,
        padding: 16,
        margin: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    medicineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    medicineInfo: {
        flex: 1,
        marginRight: 16
    },
    medicineName: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: 4
    },
    medicineForm: {
        fontSize: 16,
        color: '#8F9BB3'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500'
    },
    section: {
        marginTop: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: 8
    },
    sectionText: {
        fontSize: 16,
        color: '#2E3A59',
        lineHeight: 24
    },
    schedulesCard: {
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: '#FFFFFF'
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2E3A59'
    },
    addScheduleButton: {
        padding: 5
    },
    scheduleItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    scheduleContent: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16
    },
    scheduleTime: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2E3A59',
        marginLeft: 8
    },
    scheduleDetails: {
        flex: 1
    },
    scheduleDosage: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2E3A59',
        marginBottom: 4
    },
    scheduleFrequency: {
        fontSize: 14,
        color: '#8F9BB3',
        marginBottom: 4
    },
    scheduleNotes: {
        fontSize: 14,
        color: '#8F9BB3',
        fontStyle: 'italic'
    },
    emptySchedules: {
        alignItems: 'center',
        padding: 20
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2E3A59',
        marginBottom: 8
    },
    emptySubText: {
        fontSize: 14,
        color: '#8F9BB3',
        textAlign: 'center'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    errorText: {
        fontSize: 16,
        color: '#FF3D71',
        textAlign: 'center',
        marginBottom: 16
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12
    },
    retryText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default MedicineDetailsScreen; 