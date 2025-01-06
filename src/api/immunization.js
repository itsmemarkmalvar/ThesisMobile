import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const immunizationApi = {
  // Get master list of vaccines with completion status
  getVaccines: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/vaccinations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  },

  // Mark a vaccine as completed
  markVaccineCompleted: async (token, { vaccine_id, given_at, administered_by, administered_at, notes }) => {
    try {
      const response = await axios.post(`${API_URL}/vaccinations/mark-completed`, {
        vaccine_id,
        given_at,
        administered_by,
        administered_at,
        notes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error marking vaccine as completed:', error);
      throw error;
    }
  },

  // Get vaccination history
  getVaccinationHistory: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/vaccinations/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vaccination history:', error);
      throw error;
    }
  },

  // Add new method for scheduling vaccines
  scheduleVaccine: async (token, { vaccine_id, scheduled_date, notes }) => {
    try {
      const response = await axios.post(`${API_URL}/vaccinations/schedule`, {
        vaccine_id,
        scheduled_date,
        notes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling vaccine:', error);
      throw error;
    }
  },

  async generateSchedulePDF(token) {
    try {
      const response = await axios.get(`${API_URL}/vaccinations/schedule/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },

  // Update reminder settings for a vaccine
  updateReminder: async (settings) => {
    try {
      await AsyncStorage.setItem('vaccineReminderSettings', JSON.stringify(settings));
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  },

  getReminderSettings: async () => {
    try {
      const settings = await AsyncStorage.getItem('vaccineReminderSettings');
      return settings ? JSON.parse(settings) : {
        enabled: true,
        reminderDays: 7,
        reminderTime: '09:00'
      };
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      throw error;
    }
  }
}; 