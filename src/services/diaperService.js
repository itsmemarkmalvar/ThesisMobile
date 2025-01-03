import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const diaperService = {
  async fetchDiaperLogs(startDate, endDate, type) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const params = {};
      
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
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

      return response.data;
    } catch (error) {
      console.error('Error fetching diaper logs:', error);
      throw error;
    }
  },

  async saveDiaperLog(diaperData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(`${API_URL}/diaper-logs`, diaperData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error saving diaper log:', error);
      throw error;
    }
  },

  async updateDiaperLog(id, diaperData) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(`${API_URL}/diaper-logs/${id}`, diaperData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

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