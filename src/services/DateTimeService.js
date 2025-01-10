import { parseISO, format, isValid } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const MANILA_TIMEZONE = 'Asia/Manila';

export const DateTimeService = {
    // Convert UTC date to Manila time
    toManilaTime: (utcDate) => {
        try {
            if (!utcDate) return null;

            // Parse the date string if it's not already a Date object
            const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;

            // Validate the date
            if (!isValid(date)) {
                console.warn('Invalid date provided to toManilaTime:', utcDate);
                return null;
            }

            // Convert to Manila time
            const manilaDate = utcToZonedTime(date, MANILA_TIMEZONE);
            return manilaDate;
        } catch (error) {
            console.error('Error converting to Manila time:', error);
            return null;
        }
    },

    // Convert Manila time to UTC
    toUTC: (manilaDate) => {
        try {
            if (!manilaDate) return null;

            // Parse the date string if it's not already a Date object
            const date = typeof manilaDate === 'string' ? parseISO(manilaDate) : manilaDate;

            // Validate the date
            if (!isValid(date)) {
                console.warn('Invalid date provided to toUTC:', manilaDate);
                return null;
            }

            // Convert to UTC
            const utcDate = zonedTimeToUtc(date, MANILA_TIMEZONE);
            return utcDate;
        } catch (error) {
            console.error('Error converting to UTC:', error);
            return null;
        }
    },

    // Format date for display (in Manila time)
    formatForDisplay: (date, formatStr = 'MMM d, yyyy') => {
        try {
            if (!date) return '';

            // Parse the date string if it's not already a Date object
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;

            // Validate the date
            if (!isValid(parsedDate)) {
                console.warn('Invalid date provided to formatForDisplay:', date);
                return '';
            }

            // Convert to Manila time and format
            const manilaDate = utcToZonedTime(parsedDate, MANILA_TIMEZONE);
            return format(manilaDate, formatStr);
        } catch (error) {
            console.error('Error formatting date for display:', error);
            return '';
        }
    },

    // Format date for API (in UTC)
    formatForAPI: (date) => {
        try {
            if (!date) return null;

            // Parse the date string if it's not already a Date object
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;

            // Validate the date
            if (!isValid(parsedDate)) {
                console.warn('Invalid date provided to formatForAPI:', date);
                return null;
            }

            // Convert to UTC and format
            const utcDate = zonedTimeToUtc(parsedDate, MANILA_TIMEZONE);
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

            // Parse dates if they're strings
            const parsed1 = typeof date1 === 'string' ? parseISO(date1) : date1;
            const parsed2 = typeof date2 === 'string' ? parseISO(date2) : date2;

            // Validate dates
            if (!isValid(parsed1) || !isValid(parsed2)) {
                console.warn('Invalid date in comparison:', { date1, date2 });
                return false;
            }

            // Convert both to Manila time and compare YYYY-MM-DD only
            const manila1 = utcToZonedTime(parsed1, MANILA_TIMEZONE);
            const manila2 = utcToZonedTime(parsed2, MANILA_TIMEZONE);

            return format(manila1, 'yyyy-MM-dd') === format(manila2, 'yyyy-MM-dd');
        } catch (error) {
            console.error('Error comparing dates:', error);
            return false;
        }
    },

    // Get calendar date string (YYYY-MM-DD)
    getCalendarDate: (date) => {
        try {
            if (!date) return '';

            // Parse the date string if it's not already a Date object
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;

            // Validate the date
            if (!isValid(parsedDate)) {
                console.warn('Invalid date provided to getCalendarDate:', date);
                return '';
            }

            // Convert to Manila time and format as YYYY-MM-DD
            const manilaDate = utcToZonedTime(parsedDate, MANILA_TIMEZONE);
            return format(manilaDate, 'yyyy-MM-dd');
        } catch (error) {
            console.error('Error getting calendar date:', error);
            return '';
        }
    }
}; 