import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { format } from 'date-fns';

// Helper functions for time conversion
const convertToUTC = (manilaTime) => {
    if (!manilaTime) return null;
    // Subtract 8 hours to convert Manila time to UTC
    return new Date(manilaTime.getTime() - (8 * 60 * 60 * 1000));
};

const convertToManilaTime = (utcTime) => {
    if (!utcTime) return null;
    // Add 8 hours to convert UTC to Manila time
    return new Date(utcTime.getTime() + (8 * 60 * 60 * 1000));
};

export const diaperService = {
  async fetchDiaperLogs(startDate, endDate, type) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const params = {};
      
      if (startDate && endDate) {
        // Convert filter dates to UTC for API
        const utcStart = convertToUTC(new Date(startDate));
        const utcEnd = convertToUTC(new Date(endDate));
        
        params.start_date = utcStart.toISOString();
        params.end_date = utcEnd.toISOString();
      }
      
      if (type) {
        params.type = type;
      }

      const response = await axios.get(`${API_URL}/diaper-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      });

      // Convert response times to Manila time
      if (response.data?.data) {
        response.data.data = response.data.data.map(log => ({
          ...log,
          time: convertToManilaTime(new Date(log.time))
        }));
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching diaper logs:', error);
      throw error;
    }
  },

  async saveDiaperLog(diaperData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Convert Manila time to UTC for storage
      const utcTime = convertToUTC(new Date(diaperData.time));
      
      const formattedData = {
        ...diaperData,
        time: utcTime.toISOString()
      };

      console.log('Saving diaper log:', {
        manila: format(new Date(diaperData.time), "yyyy-MM-dd HH:mm:ss"),
        utc: format(utcTime, "yyyy-MM-dd HH:mm:ss")
      });

      const response = await axios.post(`${API_URL}/diaper-logs`, formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // Convert response time back to Manila time
      if (response.data) {
        response.data.time = convertToManilaTime(new Date(response.data.time));
      }

      return response.data;
    } catch (error) {
      console.error('Error saving diaper log:', error);
      throw error;
    }
  },

  async updateDiaperLog(id, diaperData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Convert Manila time to UTC for storage
      const utcTime = convertToUTC(new Date(diaperData.time));
      
      const formattedData = {
        ...diaperData,
        time: utcTime.toISOString()
      };

      console.log('Updating diaper log:', {
        id,
        manila: format(new Date(diaperData.time), "yyyy-MM-dd HH:mm:ss"),
        utc: format(utcTime, "yyyy-MM-dd HH:mm:ss")
      });

      const response = await axios.put(`${API_URL}/diaper-logs/${id}`, formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // Convert response time back to Manila time
      if (response.data) {
        response.data.time = convertToManilaTime(new Date(response.data.time));
      }

      return response.data;
    } catch (error) {
      console.error('Error updating diaper log:', error);
      throw error;
    }
  },

  async deleteDiaperLog(id) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_URL}/diaper-logs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting diaper log:', error);
      throw error;
    }
  },

  async getDiaperStats(startDate, endDate) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/diaper-logs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching diaper stats:', error);
      throw error;
    }
  },

  async syncWithServer() {
    try {
      // For now, we'll just fetch the latest data
      // In the future, we can implement more complex sync logic if needed
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      await this.fetchDiaperLogs(
        thirtyDaysAgo.toISOString(),
        today.toISOString()
      );

      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      throw error;
    }
  }
}; 