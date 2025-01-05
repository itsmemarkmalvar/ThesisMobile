import axios from 'axios';
import { API_URL } from '../config';

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
  }
}; 