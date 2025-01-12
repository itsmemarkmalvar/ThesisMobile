import api from './ApiService';
import { format, startOfDay, endOfDay } from 'date-fns';

export const SleepService = {
    // Get sleep logs with optional filters
    getSleepLogs: async (filters = {}) => {
        try {
            // Create dates in Manila time
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();

            // Set the time to start of day and end of day in Manila time
            const startDate = new Date(startDateObj);
            startDate.setHours(0, 0, 0, 0);  // 12:00 AM Manila time

            const endDate = new Date(endDateObj);
            endDate.setHours(23, 59, 59, 999);  // 11:59:59.999 PM Manila time

            // Convert to UTC for API request
            const utcStartDate = SleepService.convertToUTC(startDate);
            const utcEndDate = SleepService.convertToUTC(endDate);

            if (!utcStartDate || !utcEndDate) {
                throw new Error('Invalid date range');
            }

            console.log('Date ranges:', {
                manila: {
                    start: format(startDate, "yyyy-MM-dd HH:mm:ss"),
                    end: format(endDate, "yyyy-MM-dd HH:mm:ss")
                },
                utc: {
                    start: format(utcStartDate, "yyyy-MM-dd HH:mm:ss"),
                    end: format(utcEndDate, "yyyy-MM-dd HH:mm:ss")
                }
            });

            const formattedFilters = {
                ...filters,
                start_date: utcStartDate.toISOString(),
                end_time: utcEndDate.toISOString()
            };

            const response = await api.get('/sleep', { params: formattedFilters });
            
            console.log('Sleep logs response:', {
                raw: response.data?.data,
                count: response.data?.data?.length
            });

            // Process and convert times back to Manila time
            if (response.data?.data) {
                response.data.data = response.data.data
                    .map(log => {
                        try {
                            // Convert UTC strings to Date objects and adjust for Manila time
                            const manilaStart = SleepService.convertToManilaTime(new Date(log.start_time));
                            const manilaEnd = SleepService.convertToManilaTime(new Date(log.end_time));
                            
                            if (!manilaStart || !manilaEnd) {
                                console.error('Invalid time conversion for log:', log.id);
                                return null;
                            }

                            console.log('Processing sleep log:', {
                                id: log.id,
                                utc: {
                                    start: format(new Date(log.start_time), "yyyy-MM-dd HH:mm:ss"),
                                    end: format(new Date(log.end_time), "yyyy-MM-dd HH:mm:ss")
                                },
                                manila: {
                                    start: format(manilaStart, "yyyy-MM-dd HH:mm:ss"),
                                    end: format(manilaEnd, "yyyy-MM-dd HH:mm:ss")
                                }
                            });

                            return {
                                ...log,
                                start_time: manilaStart,
                                end_time: manilaEnd,
                                duration_minutes: Math.abs(log.duration_minutes)
                            };
                        } catch (error) {
                            console.error('Error processing sleep log:', {
                                id: log.id,
                                error: error.message,
                                log: log
                            });
                            return null;
                        }
                    })
                    .filter(Boolean) // Remove any failed conversions
                    .sort((a, b) => b.start_time - a.start_time); // Sort by start time, newest first
            }

            return response.data;
        } catch (error) {
            console.error('Error in getSleepLogs:', error.message);
            throw error;
        }
    },

    // Get sleep statistics for a date range
    getSleepStats: async (filters = {}) => {
        try {
            // Parse the dates to ensure correct year and time
            const startDateObj = filters.start_date ? new Date(filters.start_date) : new Date();
            const endDateObj = filters.end_date ? new Date(filters.end_date) : new Date();
            
            // Set the time components explicitly
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            
            // Format dates with time components
            const startDate = format(startDateObj, "yyyy-MM-dd'T'HH:mm:ss");
            const endDate = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const formattedFilters = {
                ...filters,
                start_date: startDate,
                end_date: endDate
            };

            const response = await api.get('/sleep/stats', { params: formattedFilters });
            
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
            
            return response.data;
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    },

    // Ensure consistent UTC formatting
    formatToUTC: (date) => {
        return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    },

    // Helper to check if a date is already in Manila time
    isManilaTZ: () => {
        const manilaTZ = 'Asia/Manila';
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log('Current timezone:', timeZone);
            return timeZone === manilaTZ;
        } catch (error) {
            console.warn('Error checking timezone:', error);
            return false;
        }
    },

    // Convert UTC to Manila time
    convertToManilaTime: (utcDate) => {
        try {
            if (!utcDate || !(utcDate instanceof Date) || isNaN(utcDate)) {
                console.warn('Invalid date provided to convertToManilaTime:', utcDate);
                return null;
            }

            // If already in Manila timezone, return the date as is
            if (SleepService.isManilaTZ()) {
                console.log('Already in Manila timezone, using date as is:', {
                    date: format(utcDate, "yyyy-MM-dd HH:mm:ss")
                });
                return utcDate;
            }

            // Add 8 hours to convert UTC to Manila time
            const manilaTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
            
            console.log('Converting UTC to Manila:', {
                utc: format(utcDate, "yyyy-MM-dd HH:mm:ss"),
                manila: format(manilaTime, "yyyy-MM-dd HH:mm:ss")
            });
            
            return manilaTime;
        } catch (error) {
            console.error('Error in convertToManilaTime:', error);
            return null;
        }
    },

    // Convert Manila time to UTC
    convertToUTC: (manilaDate) => {
        try {
            if (!manilaDate || !(manilaDate instanceof Date) || isNaN(manilaDate)) {
                console.warn('Invalid date provided to convertToUTC:', manilaDate);
                return null;
            }

            // Always subtract 8 hours to convert Manila time to UTC
            const utcDate = new Date(manilaDate.getTime() - (8 * 60 * 60 * 1000));
            
            console.log('Converting Manila to UTC:', {
                manila: format(manilaDate, "yyyy-MM-dd HH:mm:ss"),
                utc: format(utcDate, "yyyy-MM-dd HH:mm:ss")
            });
            
            return utcDate;
        } catch (error) {
            console.error('Error in convertToUTC:', error);
            return null;
        }
    },

    // Format time for display in Manila timezone
    formatTimeForDisplay: (date) => {
        try {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                console.warn('Invalid date provided to formatTimeForDisplay:', date);
                return '';
            }
            return format(date, 'MMM d, h:mm a');
        } catch (error) {
            console.error('Error in formatTimeForDisplay:', error);
            return '';
        }
    },

    // Create a new sleep log
    createSleepLog: async (sleepData) => {
        try {
            // Validate dates
            if (!sleepData.start_time || !sleepData.end_time) {
                throw new Error('Start time and end time are required');
            }

            // Convert Manila time to UTC
            const utcStart = SleepService.convertToUTC(sleepData.start_time);
            const utcEnd = SleepService.convertToUTC(sleepData.end_time);

            if (!utcStart || !utcEnd) {
                throw new Error('Invalid start time or end time');
            }

            const formattedData = {
                ...sleepData,
                start_time: utcStart.toISOString(),
                end_time: utcEnd.toISOString(),
                is_nap: Boolean(sleepData.is_nap)
            };

            console.log('Creating sleep log:', {
                manila: {
                    start: format(sleepData.start_time, "yyyy-MM-dd HH:mm:ss"),
                    end: format(sleepData.end_time, "yyyy-MM-dd HH:mm:ss")
                },
                utc: {
                    start: format(utcStart, "yyyy-MM-dd HH:mm:ss"),
                    end: format(utcEnd, "yyyy-MM-dd HH:mm:ss")
                },
                duration: `${Math.round((sleepData.end_time - sleepData.start_time) / (1000 * 60))} minutes`
            });

            const response = await api.post('/sleep', formattedData);
            
            // Convert response times back to Manila time
            if (response.data) {
                const manilaStart = SleepService.convertToManilaTime(new Date(response.data.start_time));
                const manilaEnd = SleepService.convertToManilaTime(new Date(response.data.end_time));
                
                if (manilaStart && manilaEnd) {
                    response.data.start_time = manilaStart;
                    response.data.end_time = manilaEnd;
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Error in createSleepLog:', error.message);
            throw error;
        }
    },

    // Update an existing sleep log
    updateSleepLog: async (id, sleepData) => {
        try {
            // Validate dates
            if (!sleepData.start_time || !sleepData.end_time) {
                throw new Error('Start time and end time are required');
            }

            // Convert Manila time to UTC for database storage
            const utcStart = SleepService.convertToUTC(sleepData.start_time);
            const utcEnd = SleepService.convertToUTC(sleepData.end_time);

            if (!utcStart || !utcEnd) {
                throw new Error('Invalid start time or end time');
            }

            const formattedData = {
                ...sleepData,
                start_time: utcStart.toISOString(),
                end_time: utcEnd.toISOString()
            };

            console.log('Updating sleep log:', {
                id,
                manila: {
                    start: format(sleepData.start_time, "yyyy-MM-dd HH:mm:ss"),
                    end: format(sleepData.end_time, "yyyy-MM-dd HH:mm:ss")
                },
                utc: {
                    start: format(utcStart, "yyyy-MM-dd HH:mm:ss"),
                    end: format(utcEnd, "yyyy-MM-dd HH:mm:ss")
                }
            });

            const response = await api.put(`/sleep/${id}`, formattedData);
            
            // Convert response times back to Manila time
            if (response.data) {
                const manilaStart = SleepService.convertToManilaTime(new Date(response.data.start_time));
                const manilaEnd = SleepService.convertToManilaTime(new Date(response.data.end_time));
                
                if (manilaStart && manilaEnd) {
                    response.data.start_time = manilaStart;
                    response.data.end_time = manilaEnd;
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('Error in updateSleepLog:', error);
            throw error;
        }
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