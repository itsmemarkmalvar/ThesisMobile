import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const BabyContext = createContext();

export const BabyProvider = ({ children }) => {
  const [babyData, setBabyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const fetchPromiseRef = useRef(null);

  // Cache baby data locally
  const cacheBabyData = async (data) => {
    try {
      await AsyncStorage.setItem('cachedBabyData', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error caching baby data:', e);
    }
  };

  // Load cached data
  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem('cachedBabyData');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Only use cache if it's less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setBabyData(data);
          setLastFetchTime(timestamp);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Error loading cached data:', e);
      return false;
    }
  };

  const fetchBabyData = useCallback(async (force = false) => {
    // Generate a unique request ID for logging
    const requestId = Date.now();
    console.log(`[${requestId}] Fetch request initiated, force: ${force}`);

    // If already fetching, return the existing promise
    if (isFetching && fetchPromiseRef.current) {
      console.log(`[${requestId}] Already fetching, returning existing promise`);
      return fetchPromiseRef.current;
    }

    // Check if we have valid cached data
    const hasCachedData = babyData && lastFetchTime && Date.now() - lastFetchTime < 5 * 60 * 1000;
    
    // Skip fetch if we have recent data and not forcing
    if (!force && hasCachedData) {
      console.log(`[${requestId}] Using cached data (${Math.round((Date.now() - lastFetchTime) / 1000)}s old)`);
      return Promise.resolve(babyData);
    }

    setIsFetching(true);
    setLoading(!hasCachedData); // Only show loading if we don't have cached data

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('No token found');
        }

        console.log(`[${requestId}] Making API request`);
        const response = await axios.get(`${API_URL}/baby`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.data.data) {
          let babyDataWithValidation = {
            ...response.data.data,
          };

          // Validate and format photo_url
          if (babyDataWithValidation.photo_url) {
            if (!babyDataWithValidation.photo_url.startsWith('data:image/')) {
              try {
                const base64Regex = /^[A-Za-z0-9+/=]+$/;
                const cleanBase64 = babyDataWithValidation.photo_url.trim();
                
                if (base64Regex.test(cleanBase64)) {
                  babyDataWithValidation.photo_url = `data:image/jpeg;base64,${cleanBase64}`;
                } else {
                  console.error('Invalid base64 string received');
                  babyDataWithValidation.photo_url = null;
                }
              } catch (e) {
                console.error('Error processing photo_url:', e);
                babyDataWithValidation.photo_url = null;
              }
            }
          }

          console.log(`[${requestId}] Data fetched successfully`);
          setBabyData(babyDataWithValidation);
          setLastFetchTime(Date.now());
          await cacheBabyData(babyDataWithValidation);
          return babyDataWithValidation;
        } else {
          console.log(`[${requestId}] No data returned from API`);
          setError('Baby not found. Please add your baby\'s information.');
          setBabyData(null);
          return null;
        }
      } catch (error) {
        console.error(`[${requestId}] Error:`, {
          message: error.message,
          status: error.response?.status
        });
        
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('userToken');
          setError('Session expired. Please login again.');
        } else if (error.response?.status === 404) {
          setError('Baby not found. Please add your baby\'s information.');
          setBabyData(null);
        } else {
          setError(error.message || 'Failed to fetch baby data');
          if (!force && !hasCachedData) {
            await loadCachedData();
          }
        }
        throw error;
      } finally {
        setLoading(false);
        setIsFetching(false);
        if (fetchPromiseRef.current === fetchPromise) {
          fetchPromiseRef.current = null;
        }
        console.log(`[${requestId}] Request completed`);
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [babyData, lastFetchTime, error]);

  const updateBabyData = useCallback((newData) => {
    setBabyData(current => {
      if (!current) return newData;
      const updated = {
        ...current,
        ...newData
      };
      cacheBabyData(updated);
      return updated;
    });
  }, []);

  const clearBabyData = useCallback(async () => {
    setBabyData(null);
    setError(null);
    setLastFetchTime(null);
    await AsyncStorage.removeItem('cachedBabyData');
  }, []);

  const updateError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  return (
    <BabyContext.Provider 
      value={{
        babyData,
        loading,
        error,
        fetchBabyData,
        updateBabyData,
        clearBabyData,
        updateError
      }}
    >
      {children}
    </BabyContext.Provider>
  );
};

export const useBaby = () => {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
}; 