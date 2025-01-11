import React, { createContext, useState, useContext, useEffect } from 'react';
import TimezoneService from '../services/TimezoneService';

const TimezoneContext = createContext();

export const TimezoneProvider = ({ children }) => {
    const [timezone, setTimezone] = useState('Asia/Manila');
    const [currentTime, setCurrentTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeTimezone();
    }, []);

    const initializeTimezone = async () => {
        try {
            setIsLoading(true);
            const tz = await TimezoneService.initializeTimezone();
            const current = await TimezoneService.getCurrentTimezone();
            setTimezone(current.timezone);
            setCurrentTime(current.current_time);
        } catch (error) {
            console.error('Error in TimezoneContext:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTimezone = async (newTimezone) => {
        try {
            setIsLoading(true);
            const result = await TimezoneService.updateTimezone(newTimezone);
            setTimezone(result.timezone);
            setCurrentTime(result.current_time);
            return result;
        } catch (error) {
            console.error('Error updating timezone:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TimezoneContext.Provider 
            value={{
                timezone,
                currentTime,
                isLoading,
                updateTimezone,
                refreshTimezone: initializeTimezone
            }}
        >
            {children}
        </TimezoneContext.Provider>
    );
};

export const useTimezone = () => {
    const context = useContext(TimezoneContext);
    if (!context) {
        throw new Error('useTimezone must be used within a TimezoneProvider');
    }
    return context;
};

export default TimezoneContext; 