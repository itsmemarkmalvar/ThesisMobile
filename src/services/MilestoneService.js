import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MilestoneService {
    async getHeaders() {
        const token = await AsyncStorage.getItem('userToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
    }

    async getMilestones(babyId) {
        const headers = await this.getHeaders();
        const response = await axios.get(`${API_URL}/milestones/${babyId}`, { headers });
        return response.data;
    }

    async toggleMilestone(babyId, milestoneId) {
        const headers = await this.getHeaders();
        const response = await axios.post(`${API_URL}/milestones/${babyId}/${milestoneId}/toggle`, {}, { headers });
        return response.data;
    }

    async initializeMilestones(babyId) {
        const headers = await this.getHeaders();
        const response = await axios.post(`${API_URL}/milestones/${babyId}/initialize`, {}, { headers });
        return response.data;
    }
}

export default new MilestoneService(); 