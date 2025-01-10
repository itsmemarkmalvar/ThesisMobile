import api from './ApiService';
import { format, startOfDay, endOfDay } from 'date-fns';

export const SleepService = {
    // Get sleep logs with optional filters
    getSleepLogs: async (filters = {}) => {
        try {
            console.log('=== SleepService.getSleepLogs ===');
            // Parse the dates to ensure correct year and time
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();
            
            // Set the time components explicitly
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            console.log('1. Parsed Date Objects:', {
                startDateObj: startDateObj.toISOString(),
                endDateObj: endDateObj.toISOString(),
                originalStartDate: filters.start_date,
                originalEndDate: filters.end_date
            });
            
            // Format dates with time components
            const startDate = format(startDateObj, "yyyy-MM-dd'T'HH:mm:ss");
            const endDate = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const formattedFilters = {
                ...filters,
                start_date: startDate,
                end_date: endDate
            };

            console.log('2. API Request Filters:', formattedFilters);

            const response = await api.get('/sleep', { params: formattedFilters });
            console.log('3. Raw API Response:', response.data);
            
            // Ensure duration_minutes is positive and sort by start_time
            if (response.data?.data) {
                response.data.data = response.data.data
                    .map(log => ({
                        ...log,
                        duration_minutes: Math.abs(log.duration_minutes)
                    }))
                    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            }
            
            console.log('4. Processed Response:', {
                total: response.data?.data?.length || 0,
                firstLog: response.data?.data?.[0] || null
            });
            
            return response.data;
        } catch (error) {
            console.error('5. Error in getSleepLogs:', {
                message: error.message,
                response: error.response?.data
            });
            throw error;
        }
    },

    // Get sleep statistics for a date range
    getSleepStats: async (filters = {}) => {
        try {
            console.log('=== SleepService.getSleepStats ===');
            // Parse the dates to ensure correct year and time
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();
            
            // Set the time components explicitly
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            console.log('1. Parsed Date Objects:', {
                startDateObj: startDateObj.toISOString(),
                endDateObj: endDateObj.toISOString(),
                originalStartDate: filters.start_date,
                originalEndDate: filters.end_date
            });
            
            // Format dates with time components
            const startDate = format(startDateObj, "yyyy-MM-dd'T'HH:mm:ss");
            const endDate = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const formattedFilters = {
                ...filters,
                start_date: startDate,
                end_date: endDate
            };

            console.log('2. API Request Filters:', formattedFilters);

            const response = await api.get('/sleep/stats', { params: formattedFilters });
            console.log('3. Raw Stats Response:', response.data);
            
            // Ensure all durations are positive
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

            console.log('4. Processed Stats:', response.data);
            return response.data;
        } catch (error) {
            console.error('5. Error in getSleepStats:', {
                message: error.message,
                response: error.response?.data
            });
            throw error;
        }
    },

    // Create a new sleep log
    createSleepLog: async (sleepData) => {
        try {
            const formattedData = {
                ...sleepData,
                start_time: format(new Date(sleepData.start_time), "yyyy-MM-dd'T'HH:mm:ss"),
                end_time: sleepData.end_time ? format(new Date(sleepData.end_time), "yyyy-MM-dd'T'HH:mm:ss") : null,
                is_nap: Boolean(sleepData.is_nap)
            };
            const response = await api.post('/sleep', formattedData);
            return response.data;
        } catch (error) {
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

    // Format duration for display
    formatDuration: (minutes) => {
        if (!minutes) return '0h 0m';
        
        // Convert to absolute value and round to nearest minute
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