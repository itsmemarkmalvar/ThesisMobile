import axios from 'axios';
import { API_URL } from '../config';

export const immunizationApi = {
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

  updateVaccine: async (token, { vaccineId, completed, date }) => {
    try {
      const response = await axios.put(`${API_URL}/vaccinations/${vaccineId}`, {
        completed,
        completed_date: date
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vaccine:', error);
      throw error;
    }
  },

  updateReminder: async (token, { vaccineId, enabled, days, time }) => {
    try {
      const response = await axios.put(`${API_URL}/vaccinations/${vaccineId}/reminder`, {
        reminder_enabled: enabled,
        reminder_days: days,
        reminder_time: time
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }
}; 