import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

const BabyContext = createContext();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const BabyProvider = ({ children }) => {
  const [babyData, setBabyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const fetchPromiseRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
          if (mountedRef.current) {
            setBabyData(data);
            setLastFetchTime(timestamp);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Error loading cached data:', e);
      return false;
    }
  };

  const retryFetch = async (retryCount = 0) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const response = await ApiService.get('/baby');
      
      if (response.data?.data) {
        let babyDataWithValidation = {
          ...response.data.data,
        };

        if (babyDataWithValidation.photo_url) {
          try {
            const isValidBase64 = (url) => {
              if (!url) return false;
              if (!url.startsWith('data:image/')) return false;
              const base64Match = url.match(/^data:image\/\w+;base64,(.+)$/);
              if (!base64Match) return false;
              const base64Data = base64Match[1];
              let paddedData = base64Data;
              const padding = base64Data.length % 4;
              if (padding > 0) {
                paddedData = base64Data + '='.repeat(4 - padding);
              }
              return !!paddedData && paddedData.length > 0;
            };

            if (!isValidBase64(babyDataWithValidation.photo_url)) {
              babyDataWithValidation.photo_url = null;
            }
          } catch (e) {
            console.error('Error processing photo_url:', e);
            babyDataWithValidation.photo_url = null;
          }
        }

        if (mountedRef.current) {
          setBabyData(babyDataWithValidation);
          setLastFetchTime(Date.now());
          setError(null);
        }
        await cacheBabyData(babyDataWithValidation);
        return babyDataWithValidation;
      }
      throw new Error('No baby data in response');
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return retryFetch(retryCount + 1);
      }
      throw error;
    }
  };

  const fetchBabyData = useCallback(async (force = false) => {
    const requestId = Date.now();
    console.log(`[${requestId}] Fetch request initiated, force: ${force}`);

    try {
      if (isFetching && fetchPromiseRef.current) {
        console.log(`[${requestId}] Already fetching, returning existing promise`);
        return fetchPromiseRef.current;
      }

      const hasCachedData = babyData && lastFetchTime && Date.now() - lastFetchTime < 5 * 60 * 1000;
      
      if (!force && hasCachedData) {
        console.log(`[${requestId}] Using cached data`);
        return Promise.resolve(babyData);
      }

      setIsFetching(true);
      setLoading(!hasCachedData);

      const fetchPromise = retryFetch();
      fetchPromiseRef.current = fetchPromise;

      return await fetchPromise;
    } catch (error) {
      console.error(`[${requestId}] Error:`, error);
      
      if (error.message === 'SESSION_EXPIRED') {
        setError('Session expired. Please login again.');
      } else {
        setError('Unable to fetch baby data. Please try again.');
        if (!force) {
          await loadCachedData();
        }
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
      fetchPromiseRef.current = null;
    }
  }, [babyData, lastFetchTime]);

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