import React, { useState, useEffect, useCallback } from 'react';
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
import { Card, Button, Icon } from '@rneui/themed';
import { SleepService } from '../services/SleepService';
import { useBaby } from '../context/BabyContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, startOfDay, subDays, endOfDay } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const SleepScreen = ({ navigation }) => {
    const { baby, babyData, loading: babyLoading, error: babyError } = useBaby();
    const [sleepLogs, setSleepLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();
        
        // Create today's date with the current year, ensuring we start at midnight
        const todayDate = new Date(currentYear, currentMonth, currentDate, 0, 0, 0);
        
        // Create start date (7 days ago at 00:00:00)
        const startDate = new Date(currentYear, currentMonth, currentDate - 7, 0, 0, 0);
        
        // Create end date (today at 23:59:59)
        const endDate = new Date(currentYear, currentMonth, currentDate, 23, 59, 59);
        
        return { startDate, endDate };
    });

    const loadData = async () => {
        try {
            if (!babyData) {
                setError('No baby data available');
                return;
            }

            setLoading(true);
            setError(null);

            // Format dates for API request
            const formattedStartDate = format(dateRange.startDate, 'yyyy-MM-dd');
            const formattedEndDate = format(dateRange.endDate, 'yyyy-MM-dd');

            const [logsResponse, statsResponse] = await Promise.all([
                SleepService.getSleepLogs({
                    start_date: formattedStartDate,
                    end_date: formattedEndDate
                }),
                SleepService.getSleepStats({
                    start_date: formattedStartDate,
                    end_date: formattedEndDate
                })
            ]);

            console.log('📊 Sleep Overview Card:', {
                totalSleep: `${SleepService.formatDuration(statsResponse.total_sleep_minutes)}`,
                dailyAverage: `${SleepService.formatDuration(statsResponse.average_sleep_minutes_per_day)}`,
                totalNaps: statsResponse.naps.count,
                sleepQuality: statsResponse.quality_distribution,
                sleepLocations: statsResponse.location_distribution
            });

            setSleepLogs(logsResponse.data);
            setStats(statsResponse);
        } catch (error) {
            console.error('❌ Error:', error.message);
            setError(error.response?.data?.message || 'Failed to load sleep data');
            
            if (error.response?.status === 401) {
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Error',
                    'Failed to load sleep data. Please try again later.',
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
        }, [babyData, dateRange])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const renderSleepStats = () => {
        if (!stats) return null;

        return (
            <Card containerStyle={styles.statsCard}>
                <Card.Title style={styles.cardTitle}>Sleep Overview</Card.Title>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Icon name="access-time" size={24} color="#FF9A9E" />
                        <Text style={styles.statLabel}>Total Sleep</Text>
                        <Text style={styles.statValue}>
                            {SleepService.formatDuration(stats.total_sleep_minutes)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="trending-up" size={24} color="#FF9A9E" />
                        <Text style={styles.statLabel}>Daily Average</Text>
                        <Text style={styles.statValue}>
                            {SleepService.formatDuration(stats.average_sleep_minutes_per_day)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="brightness-3" size={24} color="#FF9A9E" />
                        <Text style={styles.statLabel}>Naps</Text>
                        <Text style={styles.statValue}>{stats.naps.count}</Text>
                    </View>
                </View>
            </Card>
        );
    };

    const renderSleepLogs = () => {
        return sleepLogs.map((log) => {
            try {
                // Log the raw data for debugging
                console.log('Raw sleep log data:', {
                    id: log.id,
                    start_time: log.start_time,
                    end_time: log.end_time,
                    is_nap: log.is_nap,
                    duration: log.duration_minutes
                });

                // The times are already in Manila time from getSleepLogs service
                const startTime = new Date(log.start_time);
                const endTime = new Date(log.end_time);

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.error('Invalid time values for log:', {
                        id: log.id,
                        start: log.start_time,
                        end: log.end_time
                    });
                    return null;
                }

                // Format times for display using consistent formatting
                const startTimeDisplay = format(startTime, 'MMM d, h:mm a');
                const endTimeDisplay = format(endTime, 'h:mm a');

                console.log('Formatted sleep log:', {
                    id: log.id,
                    type: log.is_nap ? 'Nap' : 'Night Sleep',
                    startTime: startTimeDisplay,
                    endTime: endTimeDisplay,
                    duration: SleepService.formatDuration(log.duration_minutes),
                    times: {
                        start: format(startTime, "yyyy-MM-dd HH:mm:ss"),
                        end: format(endTime, "yyyy-MM-dd HH:mm:ss")
                    }
                });

                return (
                    <TouchableOpacity
                        key={log.id}
                        onPress={() => navigation.navigate('EditSleep', { 
                            sleepLog: {
                                ...log,
                                start_time: log.start_time.toISOString(),
                                end_time: log.end_time.toISOString()
                            }
                        })}
                        style={styles.logTouchable}
                    >
                        <Card containerStyle={styles.logCard}>
                            <View style={styles.logHeader}>
                                <View style={styles.logTypeContainer}>
                                    <Icon
                                        name={log.is_nap ? 'brightness-5' : 'brightness-3'}
                                        size={20}
                                        color="#FF9A9E"
                                        style={styles.logIcon}
                                    />
                                    <Text style={styles.logType}>
                                        {log.is_nap ? 'Nap' : 'Night Sleep'}
                                    </Text>
                                </View>
                                <Text style={styles.logDuration}>
                                    {SleepService.formatDuration(log.duration_minutes)}
                                </Text>
                            </View>
                            <View style={styles.logDetails}>
                                <View style={styles.logTimeContainer}>
                                    <Icon name="schedule" size={16} color="#8F9BB3" style={styles.detailIcon} />
                                    <Text style={styles.logTime}>
                                        {startTimeDisplay} - {endTimeDisplay}
                                    </Text>
                                </View>
                                <View style={styles.logQualityContainer}>
                                    <Icon name="star" size={16} color="#8F9BB3" style={styles.detailIcon} />
                                    <Text style={styles.logQuality}>
                                        Quality: {log.quality || 'Not specified'}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                );
            } catch (error) {
                console.error('Error rendering sleep log:', {
                    id: log?.id,
                    error: error.message,
                    stack: error.stack
                });
                return null;
            }
        }).filter(Boolean); // Remove any null entries from failed renders
    };

    if (babyLoading || loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    style={styles.gradient}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF9A9E" />
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (babyError) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    style={styles.gradient}
                >
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {babyError === 'SESSION_EXPIRED' 
                                ? 'Your session has expired. Please log in again.'
                                : 'Unable to load baby data. Please try again.'}
                        </Text>
                        <Button
                            title="Try Again"
                            onPress={loadData}
                            containerStyle={styles.retryButton}
                        />
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
                    style={styles.gradient}
                >
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Button
                            title="Try Again"
                            onPress={loadData}
                            containerStyle={styles.retryButton}
                        />
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

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
                    <Text style={styles.headerTitle}>Sleep Tracking</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddSleep')}
                    >
                        <MaterialIcons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
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
                    {renderSleepStats()}
                    {sleepLogs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="nightlight" size={48} color="#8F9BB3" />
                            <Text style={styles.emptyText}>No sleep logs found</Text>
                            <Text style={styles.emptySubText}>
                                Tap the + button to add a sleep log
                            </Text>
                        </View>
                    ) : (
                        renderSleepLogs()
                    )}
                </ScrollView>
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
        paddingTop: 0
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
    addButton: {
        padding: 12,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    scrollContent: {
        padding: 16
    },
    statsCard: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 16
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: 16
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 8
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8
    },
    statLabel: {
        fontSize: 14,
        color: '#8F9BB3',
        marginTop: 8,
        marginBottom: 4
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59'
    },
    logCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#E4E9F2'
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    logTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginLeft: 8
    },
    logDuration: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500'
    },
    logDetails: {
        marginTop: 8
    },
    logTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    logTime: {
        fontSize: 14,
        color: '#8F9BB3',
        marginLeft: 8
    },
    logQualityContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logQuality: {
        fontSize: 14,
        color: '#8F9BB3',
        marginLeft: 8
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        marginTop: 24
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginTop: 16,
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
        padding: 24
    },
    errorText: {
        fontSize: 16,
        color: '#FF3D71',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24
    }
});

export default SleepScreen; 