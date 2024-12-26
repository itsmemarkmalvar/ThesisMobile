import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const DIAPER_STORAGE_KEY = '@diaper_logs';

export const diaperService = {
  // Fetch diaper logs from API
  async fetchDiaperLogs() {
    try {
      // For now, just return local data until API is ready
      return this.getLocalDiaperLogs();
      
      // Uncomment this when API is ready
      /*
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/diaper-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
      */
    } catch (error) {
      console.error('Error fetching diaper logs:', error);
      return this.getLocalDiaperLogs();
    }
  },

  // Save diaper log to API and local storage
  async saveDiaperLog(diaperData) {
    try {
      // For now, just save locally until API is ready
      return this.saveToLocalStorage({
        ...diaperData,
        id: Date.now(), // Generate temporary ID
        synced: false
      });
      
      // Uncomment this when API is ready
      /*
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(`${API_URL}/diaper-logs`, diaperData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      await this.saveToLocalStorage(response.data);
      return response.data;
      */
    } catch (error) {
      console.error('Error saving diaper log:', error);
      return this.saveToLocalStorage({
        ...diaperData,
        id: Date.now(),
        synced: false
      });
    }
  },

  // Local storage functions
  async getLocalDiaperLogs() {
    try {
      const logsJson = await AsyncStorage.getItem(DIAPER_STORAGE_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Error reading local diaper logs:', error);
      return [];
    }
  },

  async saveToLocalStorage(diaperLog) {
    try {
      const existingLogs = await this.getLocalDiaperLogs();
      const updatedLogs = [diaperLog, ...existingLogs];
      await AsyncStorage.setItem(DIAPER_STORAGE_KEY, JSON.stringify(updatedLogs));
      return diaperLog;
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  },

  // Sync can be implemented later when API is ready
  async syncWithServer() {
    // For now, just return true to prevent errors
    return true;
    
    // Uncomment this when API is ready
    /*
    try {
      const localLogs = await this.getLocalDiaperLogs();
      const token = await AsyncStorage.getItem('userToken');
      const unsynced = localLogs.filter(log => !log.synced);
      
      const syncPromises = unsynced.map(async (log) => {
        try {
          const response = await axios.post(`${API_URL}/diaper-logs`, log, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          return response.data;
        } catch (error) {
          console.error('Error syncing log:', error);
          return null;
        }
      });

      const syncedLogs = await Promise.all(syncPromises);
      return syncedLogs.filter(Boolean);
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }
    */
  }
}; 