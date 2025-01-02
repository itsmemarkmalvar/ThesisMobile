import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DevelopmentService {
    async getHeaders() {
        const token = await AsyncStorage.getItem('userToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
    }

    async getActivities(category = 'all') {
        const headers = await this.getHeaders();
        const response = await axios.get(`${API_URL}/development/activities?category=${category}`, { headers });
        return response.data;
    }

    async getDevelopmentTips() {
        const headers = await this.getHeaders();
        const response = await axios.get(`${API_URL}/development/tips`, { headers });
        return response.data;
    }

    async trackActivity(activityId, notes = '') {
        const headers = await this.getHeaders();
        const response = await axios.post(`${API_URL}/development/track-activity`, {
            activity_id: activityId,
            completed_at: new Date().toISOString(),
            notes: notes
        }, { headers });
        return response.data;
    }

    async getActivityProgress(babyId) {
        const headers = await this.getHeaders();
        const response = await axios.get(`${API_URL}/development/activity-progress/${babyId}`, { headers });
        return response.data;
    }
}

export default new DevelopmentService(); 