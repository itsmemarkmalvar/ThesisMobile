import axios from 'axios';
import { API_URL } from '../config';

export const immunizationApi = {
  getVaccines: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/immunization`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateVaccine: async (token, data) => {
    try {
      const response = await axios.post(`${API_URL}/immunization/update`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 