import ApiService from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEZONE_STORAGE_KEY = '@timezone_preference';
const DEFAULT_TIMEZONE = 'Asia/Manila';

class TimezoneService {
    static async initializeTimezone() {
        try {
            // First check if we have a stored preference
            const storedTimezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
            if (storedTimezone) {
                return storedTimezone;
            }

            // Get device timezone with fallback
            let deviceTimezone = DEFAULT_TIMEZONE;
            try {
                const RNLocalize = require('react-native-localize');
                if (RNLocalize && RNLocalize.getTimeZone) {
                    deviceTimezone = RNLocalize.getTimeZone();
                }
            } catch (error) {
                console.warn('Could not get device timezone, using default:', error);
            }

            // Store timezone locally (we'll sync with backend after login)
            await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, deviceTimezone);
            return deviceTimezone;
        } catch (error) {
            console.error('Error initializing timezone:', error);
            return DEFAULT_TIMEZONE;
        }
    }

    static async getCurrentTimezone() {
        try {
            // First try to get from local storage
            const stored = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
            if (stored) {
                return { timezone: stored };
            }

            // If we have an auth token, try to get from backend
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const response = await ApiService.get('/timezone/current');
                    return response.data;
                } catch (error) {
                    console.warn('Error getting timezone from backend:', error);
                }
            }

            // Default fallback
            return { timezone: DEFAULT_TIMEZONE };
        } catch (error) {
            console.error('Error getting current timezone:', error);
            return { timezone: DEFAULT_TIMEZONE };
        }
    }

    static async updateTimezone(timezone) {
        try {
            // Always store locally
            await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);

            // Only try to update backend if we're logged in
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const response = await ApiService.post('/timezone/update', {
                        timezone: timezone
                    });
                    return response.data;
                } catch (error) {
                    console.warn('Error updating timezone in backend:', error);
                }
            }
            
            return { timezone };
        } catch (error) {
            console.error('Error updating timezone:', error);
            return { timezone };
        }
    }

    static async validateTimezone(timezone) {
        try {
            // Only validate with backend if logged in
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const response = await ApiService.post('/timezone/validate', {
                        timezone: timezone
                    });
                    return response.data;
                } catch (error) {
                    console.warn('Error validating timezone with backend:', error);
                }
            }
            
            // Consider timezone valid by default
            return { valid: true, timezone };
        } catch (error) {
            console.error('Error validating timezone:', error);
            return { valid: true, timezone };
        }
    }

    static formatDateTime(dateTime, format = 'YYYY-MM-DD HH:mm:ss') {
        try {
            const date = new Date(dateTime);
            return date.toLocaleString('en-US', {
                timeZone: DEFAULT_TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateTime;
        }
    }

    // Call this after successful login
    static async syncWithBackend() {
        try {
            const storedTimezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
            if (storedTimezone) {
                await this.updateTimezone(storedTimezone);
            }
        } catch (error) {
            console.error('Error syncing timezone with backend:', error);
        }
    }
}

export default TimezoneService; 