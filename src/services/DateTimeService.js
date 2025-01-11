import { parseISO, format, isValid, addMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const TIMEZONE_STORAGE_KEY = 'userTimezone';
const DEFAULT_TIMEZONE = 'Asia/Manila';

export const DateTimeService = {
    // Private variable to store current timezone
    _currentTimezone: DEFAULT_TIMEZONE,
    _initialized: false,

    // Initialize timezone settings
    initialize: async () => {
        try {
            if (DateTimeService._initialized) {
                return DateTimeService._currentTimezone;
            }

            const storedTimezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
            if (storedTimezone === 'auto') {
                DateTimeService._currentTimezone = Localization.timezone;
            } else if (storedTimezone) {
                DateTimeService._currentTimezone = storedTimezone;
            }

            DateTimeService._initialized = true;
            console.log('DateTimeService initialized with timezone:', DateTimeService._currentTimezone);
            return DateTimeService._currentTimezone;
        } catch (error) {
            console.error('Error initializing DateTimeService:', error);
            return DEFAULT_TIMEZONE;
        }
    },

    // Reset to default settings
    reset: async () => {
        try {
            DateTimeService._currentTimezone = DEFAULT_TIMEZONE;
            DateTimeService._initialized = false;
            await AsyncStorage.removeItem(TIMEZONE_STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error resetting DateTimeService:', error);
            return false;
        }
    },

    // Update timezone setting
    updateTimezone: async (timezone) => {
        try {
            if (!DateTimeService._initialized) {
                await DateTimeService.initialize();
            }

            const newTimezone = timezone === 'auto' ? Localization.timezone : timezone;
            
            // Validate timezone
            try {
                // Test if timezone is valid by attempting to use it
                utcToZonedTime(new Date(), newTimezone);
            } catch (e) {
                throw new Error(`Invalid timezone: ${newTimezone}`);
            }

            DateTimeService._currentTimezone = newTimezone;
            await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
            console.log('Timezone updated to:', newTimezone);
            return true;
        } catch (error) {
            console.error('Error updating timezone:', error);
            return false;
        }
    },

    // Get current timezone
    getCurrentTimezone: () => {
        if (!DateTimeService._initialized) {
            console.warn('DateTimeService not initialized, using default timezone');
        }
        return DateTimeService._currentTimezone;
    },

    // Check if current timezone is Manila
    isManilaTZ: () => {
        return DateTimeService._currentTimezone === DEFAULT_TIMEZONE;
    },

    // Convert UTC date to current timezone
    toLocalTime: (utcDate) => {
        try {
            if (!utcDate) return null;

            // Ensure we have a Date object
            const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;

            if (!isValid(date)) {
                console.warn('Invalid date provided to toLocalTime:', utcDate);
                return null;
            }

            // For debugging
            console.log('toLocalTime conversion:', {
                input: date.toISOString(),
                timezone: DateTimeService._currentTimezone
            });

            // Convert using date-fns-tz
            const zonedDate = utcToZonedTime(date, DateTimeService._currentTimezone);
            
            // Create a clean date object without timezone information
            const localDate = new Date(
                zonedDate.getFullYear(),
                zonedDate.getMonth(),
                zonedDate.getDate(),
                zonedDate.getHours(),
                zonedDate.getMinutes(),
                0,
                0
            );

            console.log('toLocalTime result:', {
                input: date.toISOString(),
                zoned: zonedDate,
                local: localDate,
                timezone: DateTimeService._currentTimezone
            });

            return localDate;
        } catch (error) {
            console.error('Error converting to local time:', error);
            return null;
        }
    },

    // Convert local time to UTC
    toUTC: (localDate) => {
        try {
            if (!localDate) return null;

            const date = typeof localDate === 'string' ? parseISO(localDate) : localDate;

            if (!isValid(date)) {
                console.warn('Invalid date provided to toUTC:', localDate);
                return null;
            }

            // Convert to UTC using date-fns-tz
            const utcDate = zonedTimeToUtc(date, DateTimeService._currentTimezone);

            console.log('toUTC conversion:', {
                input: date,
                utc: utcDate,
                timezone: DateTimeService._currentTimezone
            });

            return utcDate;
        } catch (error) {
            console.error('Error converting to UTC:', error);
            return null;
        }
    },

    // Format date for display in local timezone
    formatForDisplay: (date, formatStr = 'MMM d, yyyy') => {
        try {
            if (!date) return '';

            const parsedDate = typeof date === 'string' ? parseISO(date) : date;

            if (!isValid(parsedDate)) {
                console.warn('Invalid date provided to formatForDisplay:', date);
                return '';
            }

            // Get the local date
            const localDate = DateTimeService.toLocalTime(parsedDate);
            
            // Format the local date
            return format(localDate, formatStr);
        } catch (error) {
            console.error('Error formatting date for display:', error);
            return '';
        }
    },

    // Format date for API (always in UTC)
    formatForAPI: (date) => {
        try {
            if (!date) return null;

            const parsedDate = typeof date === 'string' ? parseISO(date) : date;

            if (!isValid(parsedDate)) {
                console.warn('Invalid date provided to formatForAPI:', date);
                return null;
            }

            const utcDate = zonedTimeToUtc(parsedDate, DateTimeService._currentTimezone);
            return utcDate.toISOString();
        } catch (error) {
            console.error('Error formatting date for API:', error);
            return null;
        }
    },

    // Compare two dates (ignoring time)
    areDatesEqual: (date1, date2) => {
        try {
            if (!date1 || !date2) return false;

            const parsed1 = typeof date1 === 'string' ? parseISO(date1) : date1;
            const parsed2 = typeof date2 === 'string' ? parseISO(date2) : date2;

            if (!isValid(parsed1) || !isValid(parsed2)) {
                console.warn('Invalid date in comparison:', { date1, date2 });
                return false;
            }

            const local1 = utcToZonedTime(parsed1, DateTimeService._currentTimezone);
            const local2 = utcToZonedTime(parsed2, DateTimeService._currentTimezone);

            return format(local1, 'yyyy-MM-dd') === format(local2, 'yyyy-MM-dd');
        } catch (error) {
            console.error('Error comparing dates:', error);
            return false;
        }
    },

    // Get current time in local timezone
    getCurrentTime: () => {
        return utcToZonedTime(new Date(), DateTimeService._currentTimezone);
    },

    // Get current date without time in local timezone
    getCurrentDate: () => {
        const now = utcToZonedTime(new Date(), DateTimeService._currentTimezone);
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },

    // Validate date/time
    validateDateTime: (date) => {
        if (!date) return { isValid: false, error: 'Date is required' };
        
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        
        if (!isValid(parsedDate)) {
            return { isValid: false, error: 'Invalid date format' };
        }

        return { isValid: true, error: null };
    },

    // Get timezone offset in minutes
    getTimezoneOffset: () => {
        try {
            const now = new Date();
            const utcDate = zonedTimeToUtc(now, 'UTC');
            const localDate = utcToZonedTime(utcDate, DateTimeService._currentTimezone);
            
            // Calculate offset (positive for ahead of UTC, negative for behind)
            const offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (60 * 1000);
            
            console.log('Timezone offset calculation:', {
                timezone: DateTimeService._currentTimezone,
                offsetMinutes,
                utc: utcDate.toISOString(),
                local: localDate.toISOString()
            });
            
            return offsetMinutes;
        } catch (error) {
            console.error('Error calculating timezone offset:', error);
            return 0;
        }
    },

    // Add minutes to a date, respecting timezone
    addMinutes: (date, minutes) => {
        try {
            if (!date) return null;
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;
            if (!isValid(parsedDate)) return null;
            
            const localDate = utcToZonedTime(parsedDate, DateTimeService._currentTimezone);
            return addMinutes(localDate, minutes);
        } catch (error) {
            console.error('Error adding minutes to date:', error);
            return null;
        }
    },

    // Format relative time (e.g., "2 hours ago", "in 3 days")
    formatRelativeTime: (date) => {
        try {
            if (!date) return '';
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;
            if (!isValid(parsedDate)) return '';

            const now = DateTimeService.getCurrentTime();
            const localDate = utcToZonedTime(parsedDate, DateTimeService._currentTimezone);
            const diffMinutes = Math.round((localDate - now) / (1000 * 60));

            if (Math.abs(diffMinutes) < 60) {
                return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
            }

            const diffHours = Math.round(diffMinutes / 60);
            if (Math.abs(diffHours) < 24) {
                return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
            }

            const diffDays = Math.round(diffHours / 24);
            return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
        } catch (error) {
            console.error('Error formatting relative time:', error);
            return '';
        }
    }
}; 