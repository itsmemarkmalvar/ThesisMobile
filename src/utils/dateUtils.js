import { format, parseISO, formatISO } from 'date-fns';

// Parse date from API (handles ISO strings and YYYY-MM-DD formats)
export const parseDate = (dateString) => {
  if (!dateString) return null;
  try {
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    
    // Try parsing as ISO string first
    let date = parseISO(dateString);
    
    // If invalid, try parsing as YYYY-MM-DD
    if (isNaN(date.getTime()) && typeof dateString === 'string') {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

// Format date for display (consistent across app)
export const formatDisplayDate = (date) => {
  if (!date) return '';
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate) return '';
    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting display date:', error);
    return '';
  }
};

// Format time for display
export const formatDisplayTime = (date) => {
  if (!date) return '';
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate) return '';
    return format(parsedDate, 'h:mm a');
  } catch (error) {
    console.error('Error formatting display time:', error);
    return '';
  }
};

// Format date with time for display
export const formatDisplayDateTime = (date) => {
  if (!date) return '';
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate) return '';
    // Adjust for local timezone display
    const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
    return format(localDate, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting display datetime:', error);
    return '';
  }
};

// Format date for API (UTC)
export const formatAPIDate = (date) => {
  if (!date) return null;
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate) return null;
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting API date:', error);
    return null;
  }
};

// Format datetime for API (UTC)
export const formatAPIDateTime = (date) => {
  if (!date) return null;
  try {
    const parsedDate = parseDate(date);
    if (!parsedDate) return null;
    // Convert to UTC ISO string with timezone offset
    return formatISO(parsedDate);
  } catch (error) {
    console.error('Error formatting API datetime:', error);
    return null;
  }
};

// Parse time string (handles multiple formats)
export const parseTimeString = (timeString) => {
  if (!timeString) return null;
  try {
    // If it's already a Date object
    if (timeString instanceof Date) {
      return timeString;
    }

    // If it's an ISO string, parse it first
    if (timeString.includes('T') || timeString.includes('Z')) {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle HH:mm format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }

    console.error('Invalid time format:', timeString);
    return null;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
};

// Format time for medicine schedule display
export const formatMedicineTime = (timeString) => {
  if (!timeString) return '';
  try {
    const date = parseTimeString(timeString);
    if (!date) {
      console.log('Could not parse time:', timeString);
      return '';
    }
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting medicine time:', error);
    return '';
  }
};

// Format time for API (24-hour format)
export const formatAPITime = (date) => {
  if (!date) return null;
  try {
    const parsedDate = parseTimeString(date);
    if (!parsedDate) return null;
    return format(parsedDate, 'HH:mm');
  } catch (error) {
    console.error('Error formatting API time:', error);
    return null;
  }
};

// Sleep validation constants
const MAX_NAP_DURATION_MINUTES = 180; // 3 hours
const MAX_NIGHT_SLEEP_DURATION_MINUTES = 840; // 14 hours
const MIN_NIGHT_SLEEP_DURATION_MINUTES = 360; // 6 hours

// Calculate duration between two dates in minutes
export const calculateDurationInMinutes = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

// Validate sleep duration based on type (nap or night sleep)
export const validateSleepDuration = (startTime, endTime, isNap) => {
    const durationInMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    console.log('Validating sleep duration:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isNap,
        durationInMinutes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    if (isNap) {
        if (durationInMinutes > 180) { // 3 hours
            return {
                isValid: false,
                error: 'Nap duration cannot exceed 3 hours'
            };
        }
    } else {
        if (durationInMinutes > 720) { // 12 hours
            return {
                isValid: false,
                error: 'Night sleep duration cannot exceed 12 hours'
            };
        }
    }

    if (durationInMinutes < 15) {
        return {
            isValid: false,
            error: 'Sleep duration must be at least 15 minutes'
        };
    }

    return { isValid: true };
};

// Validate if the sleep time is not in the future
export const validateSleepTime = (startTime, endTime) => {
    const now = new Date();
    
    console.log('Validating sleep time:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        now: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    if (startTime > now || endTime > now) {
        return {
            isValid: false,
            error: 'Sleep times cannot be in the future'
        };
    }

    return { isValid: true };
}; 