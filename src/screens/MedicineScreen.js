import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Icon } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { MedicineService } from '../services/MedicineService';
import { useBaby } from '../context/BabyContext';
import { format } from 'date-fns';

const MedicineScreen = ({ navigation }) => {
    const { baby, babyData, loading: babyLoading, error: babyError } = useBaby();
    const [medicines, setMedicines] = useState([]);
    const [upcomingSchedules, setUpcomingSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            if (!babyData) {
                setError('No baby data available');
                return;
            }

            setLoading(true);
            setError(null);

            const [medicinesResponse, schedulesResponse] = await Promise.all([
                MedicineService.getMedicines(),
                MedicineService.getUpcomingSchedules()
            ]);

            setMedicines(medicinesResponse);
            setUpcomingSchedules(schedulesResponse);
        } catch (error) {
            console.error('Error loading medicine data:', error);
            setError(error.response?.data?.message || 'Failed to load medicine data');
            
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
            if (babyData) {
                loadData();
            }
        }, [babyData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const formatTime = (timeString) => {
        try {
            // Split the time string into hours and minutes
            const [hours, minutes] = timeString.split(':');
            
            // Create a base date for today
            const date = new Date();
            date.setHours(parseInt(hours, 10));
            date.setMinutes(parseInt(minutes, 10));
            date.setSeconds(0);
            date.setMilliseconds(0);
            
            return format(date, 'h:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString; // Return original string if formatting fails
        }
    };

    const renderUpcomingSchedules = () => {
        if (upcomingSchedules.length === 0) return null;

        return (
            <Card containerStyle={styles.upcomingCard}>
                <Card.Title style={styles.cardTitle}>Upcoming Doses</Card.Title>
                <View style={styles.upcomingList}>
                    {upcomingSchedules.map((schedule) => (
                        <View key={schedule.id} style={styles.upcomingItem}>
                            <View style={styles.upcomingTime}>
                                <Icon name="access-time" size={20} color="#4A90E2" />
                                <Text style={styles.timeText}>
                                    {formatTime(schedule.time)}
                                </Text>
                            </View>
                            <View style={styles.upcomingDetails}>
                                <Text style={styles.medicineName}>{schedule.medicine.name}</Text>
                                <Text style={styles.dosageText}>{schedule.dosage}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Card>
        );
    };

    const renderMedicineList = () => {
        if (medicines.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="medical-services" size={48} color="#8F9BB3" />
                    <Text style={styles.emptyText}>No medicines added yet</Text>
                    <Text style={styles.emptySubText}>
                        Add your first medicine to start tracking
                    </Text>
                </View>
            );
        }

        return medicines.map((medicine) => (
            <TouchableOpacity
                key={medicine.id}
                onPress={() => navigation.navigate('MedicineDetails', { medicine })}
                style={styles.medicineCard}
            >
                <Card containerStyle={styles.cardContainer}>
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
                    {medicine.schedules?.length > 0 && (
                        <View style={styles.scheduleInfo}>
                            <Icon name="schedule" size={16} color="#8F9BB3" />
                            <Text style={styles.scheduleText}>
                                {medicine.schedules.length} schedule{medicine.schedules.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        ));
    };

    if (babyLoading || loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4A90E2" />
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
                    <Text style={styles.headerTitle}>Medicine Tracker</Text>
                </View>
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4A90E2']}
                            tintColor="#4A90E2"
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderUpcomingSchedules()}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddMedicine')}
                    >
                        <View style={styles.addButtonInner}>
                            <Icon
                                name="add"
                                size={24}
                                color="#4A90E2"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.addButtonTitle}>Add Medicine</Text>
                        </View>
                    </TouchableOpacity>
                    {renderMedicineList()}
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
    scrollContent: {
        paddingBottom: 24
    },
    upcomingCard: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardTitle: {
        fontSize: 18,
        color: '#2E3A59',
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'left'
    },
    upcomingList: {
        gap: 12
    },
    upcomingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        borderRadius: 8
    },
    upcomingTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12
    },
    timeText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#2E3A59',
        fontWeight: '500'
    },
    upcomingDetails: {
        flex: 1
    },
    addButton: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#4A90E2'
    },
    addButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    addButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2'
    },
    medicineCard: {
        marginHorizontal: 16,
        marginVertical: 8
    },
    cardContainer: {
        borderRadius: 12,
        padding: 16,
        margin: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3
    },
    medicineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    medicineInfo: {
        flex: 1,
        marginRight: 12
    },
    medicineName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: 4
    },
    medicineForm: {
        fontSize: 14,
        color: '#8F9BB3'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500'
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12
    },
    scheduleText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#8F9BB3'
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
        marginTop: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        margin: 16,
        borderRadius: 12
    },
    emptyText: {
        fontSize: 18,
        color: '#2E3A59',
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '600'
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
        padding: 24
    },
    errorText: {
        fontSize: 16,
        color: '#FF3D71',
        textAlign: 'center',
        marginBottom: 16
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default MedicineScreen; 