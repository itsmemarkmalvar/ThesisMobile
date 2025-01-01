import ApiService from './ApiService';

class FeedingService {
    async getFeedingLogs(date = null) {
        const endpoint = date ? `/feeding?date=${date}` : '/feeding';
        const response = await ApiService.get(endpoint);
        return response.data.data;
    }

    async createFeedingLog(feedingData) {
        const response = await ApiService.post('/feeding', feedingData);
        return response.data.data;
    }

    async updateFeedingLog(id, feedingData) {
        const response = await ApiService.put(`/feeding/${id}`, feedingData);
        return response.data.data;
    }

    async deleteFeedingLog(id) {
        const response = await ApiService.delete(`/feeding/${id}`);
        return response.data;
    }

    async getFeedingStats(date = null) {
        const endpoint = date ? `/feeding/stats?date=${date}` : '/feeding/stats';
        const response = await ApiService.get(endpoint);
        return response.data.data;
    }

    // Helper method to format feeding data
    formatFeedingData(type, startTime, data = {}) {
        const baseData = {
            type,
            start_time: startTime,
            notes: data.notes
        };

        switch (type) {
            case 'breast':
                return {
                    ...baseData,
                    duration: data.duration,
                    breast_side: data.breastSide
                };
            case 'bottle':
                return {
                    ...baseData,
                    amount: data.amount,
                    duration: data.duration
                };
            case 'solid':
                return {
                    ...baseData,
                    food_type: data.foodType,
                    amount: data.amount
                };
            default:
                return baseData;
        }
    }
}

export default new FeedingService(); 