import api from './ApiService';
import { format, parseISO } from 'date-fns';

export const SleepService = {
    // Get sleep logs with optional filters
    getSleepLogs: async (filters = {}) => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();
            
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            const startDate = format(startDateObj, "yyyy-MM-dd'T'HH:mm:ss");
            const endDate = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const formattedFilters = {
                ...filters,
                start_date: startDate,
                end_date: endDate
            };

            const response = await api.get('/sleep', { params: formattedFilters });
            
            console.log('Sleep Logs Data Flow:', {
                fetchedData: response.data?.data,
                timezone: timeZone
            });
            
            if (response.data?.data) {
                response.data.data = response.data.data
                    .map(log => ({
                        ...log,
                        duration_minutes: Math.abs(log.duration_minutes)
                    }))
                    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            }
            
            return response.data;
        } catch (error) {
            console.error('Error in getSleepLogs:', error);
            throw error;
        }
    },

    // Get sleep statistics for a date range
    getSleepStats: async (filters = {}) => {
        try {
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();
            
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            const startDate = format(startDateObj, "yyyy-MM-dd'T'HH:mm:ss");
            const endDate = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const formattedFilters = {
                ...filters,
                start_date: startDate,
                end_date: endDate
            };

            const response = await api.get('/sleep/stats', { params: formattedFilters });
            
            if (response.data) {
                response.data = {
                    ...response.data,
                    total_sleep_minutes: Math.abs(response.data.total_sleep_minutes || 0),
                    average_sleep_minutes_per_day: Math.abs(response.data.average_sleep_minutes_per_day || 0),
                    naps: {
                        ...response.data.naps,
                        average_duration: response.data.naps?.average_duration ? Math.abs(response.data.naps.average_duration) : null,
                        total_minutes: Math.abs(response.data.naps?.total_minutes || 0)
                    },
                    night_sleep: {
                        ...response.data.night_sleep,
                        average_duration: response.data.night_sleep?.average_duration ? Math.abs(response.data.night_sleep.average_duration) : null,
                        total_minutes: Math.abs(response.data.night_sleep?.total_minutes || 0)
                    }
                };
            }

            console.log('Sleep Stats Data Flow:', {
                fetchedStats: response.data
            });
            
            return response.data;
        } catch (error) {
            console.error('Error in getSleepStats:', error);
            throw error;
        }
    },

    // Create a new sleep log
    createSleepLog: async (sleepData) => {
        try {
            const formattedData = {
                ...sleepData,
                start_time: format(sleepData.start_time, "yyyy-MM-dd'T'HH:mm:ss"),
                end_time: sleepData.end_time ? format(sleepData.end_time, "yyyy-MM-dd'T'HH:mm:ss") : null,
                is_nap: Boolean(sleepData.is_nap)
            };
            
            console.log('Creating Sleep Log:', {
                inputData: {
                    start_time: sleepData.start_time.toISOString(),
                    end_time: sleepData.end_time?.toISOString(),
                    is_nap: sleepData.is_nap
                },
                formattedForAPI: {
                    start_time: formattedData.start_time,
                    end_time: formattedData.end_time,
                    is_nap: formattedData.is_nap
                }
            });
            
            const response = await api.post('/sleep', formattedData);
            return response.data;
        } catch (error) {
            console.error('Error in createSleepLog:', error);
            throw error;
        }
    },

    // Update an existing sleep log
    updateSleepLog: async (id, sleepData) => {
        const formattedData = {
            ...sleepData,
            start_time: format(new Date(sleepData.start_time), "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: sleepData.end_time ? format(new Date(sleepData.end_time), "yyyy-MM-dd'T'HH:mm:ss") : null
        };
        const response = await api.put(`/sleep/${id}`, formattedData);
        return response.data;
    },

    // Delete a sleep log
    deleteSleepLog: async (id) => {
        await api.delete(`/sleep/${id}`);
    },

    // Format date for display
    formatDateForDisplay: (dateString) => {
        try {
            if (!dateString) return 'Invalid date';
            
            const date = new Date(dateString);
            
            // Get hours and minutes
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            // Format month and day
            const month = date.toLocaleString('en-US', { month: 'short' });
            const day = date.getUTCDate();
            
            // Format hours for 12-hour clock
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            
            console.log('Date Display Formatting:', {
                fromDB: dateString,
                display: `${month} ${day}, ${displayHours}:${displayMinutes} ${ampm}`
            });
            
            return `${month} ${day}, ${displayHours}:${displayMinutes} ${ampm}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    },

    // Format duration for display
    formatDuration: (minutes) => {
        if (!minutes) return '0h 0m';
        const absoluteMinutes = Math.abs(Math.round(minutes));
        const hours = Math.floor(absoluteMinutes / 60);
        const remainingMinutes = absoluteMinutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    },

    // Get sleep quality options
    getSleepQualityOptions: () => [
        { label: 'Poor', value: 'poor' },
        { label: 'Fair', value: 'fair' },
        { label: 'Good', value: 'good' },
        { label: 'Excellent', value: 'excellent' }
    ],

    // Get sleep location options
    getSleepLocationOptions: () => [
        { label: 'Crib', value: 'crib' },
        { label: 'Bed', value: 'bed' },
        { label: 'Stroller', value: 'stroller' },
        { label: 'Car', value: 'car' },
        { label: 'Other', value: 'other' }
    ]
}; 