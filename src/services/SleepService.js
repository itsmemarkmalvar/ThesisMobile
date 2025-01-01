import api from './ApiService';
import { format, startOfDay, endOfDay } from 'date-fns';

export const SleepService = {
    // Get sleep logs with optional filters
    getSleepLogs: async (filters = {}) => {
        const formattedFilters = {
            ...filters,
            start_date: filters.start_date || format(startOfDay(new Date()), 'yyyy-MM-dd'),
            end_date: filters.end_date || format(endOfDay(new Date()), 'yyyy-MM-dd')
        };
        console.log('Sending sleep logs request with params:', formattedFilters);
        const response = await api.get('/sleep', { params: formattedFilters });
        return response.data;
    },

    // Get sleep statistics for a date range
    getSleepStats: async (filters = {}) => {
        try {
            const formattedFilters = {
                start_date: filters.start_date || format(startOfDay(new Date()), 'yyyy-MM-dd'),
                end_date: filters.end_date || format(endOfDay(new Date()), 'yyyy-MM-dd')
            };

            console.log('Sending sleep stats request with params:', formattedFilters);
            const response = await api.get('/sleep/stats', { params: formattedFilters });
            console.log('Sleep stats response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching sleep stats:', error.response?.data || error);
            throw error;
        }
    },

    // Create a new sleep log
    createSleepLog: async (sleepData) => {
        const formattedData = {
            ...sleepData,
            start_time: format(new Date(sleepData.start_time), "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: sleepData.end_time ? format(new Date(sleepData.end_time), "yyyy-MM-dd'T'HH:mm:ss") : null
        };
        const response = await api.post('/sleep', formattedData);
        return response.data;
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

    // Format duration for display
    formatDuration: (minutes) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
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