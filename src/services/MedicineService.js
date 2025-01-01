import ApiService from './ApiService';
import { format } from 'date-fns';

export class MedicineService {
    static async getMedicines() {
        try {
            const response = await ApiService.get('/medicines');
            return response.data;
        } catch (error) {
            console.error('Error fetching medicines:', error);
            throw error;
        }
    }

    static async getMedicine(id) {
        try {
            const response = await ApiService.get(`/medicines/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching medicine:', error);
            throw error;
        }
    }

    static async createMedicine(medicineData) {
        try {
            const response = await ApiService.post('/medicines', {
                ...medicineData,
                start_date: format(new Date(medicineData.start_date), 'yyyy-MM-dd'),
                end_date: medicineData.end_date ? format(new Date(medicineData.end_date), 'yyyy-MM-dd') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error creating medicine:', error);
            throw error;
        }
    }

    static async updateMedicine(id, medicineData) {
        try {
            const response = await ApiService.put(`/medicines/${id}`, {
                ...medicineData,
                start_date: format(new Date(medicineData.start_date), 'yyyy-MM-dd'),
                end_date: medicineData.end_date ? format(new Date(medicineData.end_date), 'yyyy-MM-dd') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error updating medicine:', error);
            throw error;
        }
    }

    static async deleteMedicine(id) {
        try {
            await ApiService.delete(`/medicines/${id}`);
        } catch (error) {
            console.error('Error deleting medicine:', error);
            throw error;
        }
    }

    static async getSchedules(medicineId) {
        try {
            const response = await ApiService.get(`/medicines/${medicineId}/schedules`);
            return response.data;
        } catch (error) {
            console.error('Error fetching schedules:', error);
            throw error;
        }
    }

    static async createSchedule(medicineId, scheduleData) {
        try {
            const response = await ApiService.post(`/medicines/${medicineId}/schedules`, scheduleData);
            return response.data;
        } catch (error) {
            console.error('Error creating schedule:', error);
            throw error;
        }
    }

    static async updateSchedule(medicineId, scheduleId, scheduleData) {
        try {
            const response = await ApiService.put(`/medicines/${medicineId}/schedules/${scheduleId}`, scheduleData);
            return response.data;
        } catch (error) {
            console.error('Error updating schedule:', error);
            throw error;
        }
    }

    static async deleteSchedule(medicineId, scheduleId) {
        try {
            await ApiService.delete(`/medicines/${medicineId}/schedules/${scheduleId}`);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            throw error;
        }
    }

    static async getUpcomingSchedules() {
        try {
            const response = await ApiService.get('/medicines/schedules/upcoming');
            return response.data;
        } catch (error) {
            console.error('Error fetching upcoming schedules:', error);
            throw error;
        }
    }

    static async getLogs(medicineId, startDate, endDate) {
        try {
            const response = await ApiService.get(`/medicines/${medicineId}/logs`, {
                params: {
                    start_date: format(new Date(startDate), 'yyyy-MM-dd'),
                    end_date: format(new Date(endDate), 'yyyy-MM-dd')
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    }

    static async createLog(medicineId, logData) {
        try {
            const response = await ApiService.post(`/medicines/${medicineId}/logs`, {
                ...logData,
                taken_at: format(new Date(logData.taken_at), "yyyy-MM-dd'T'HH:mm:ss")
            });
            return response.data;
        } catch (error) {
            console.error('Error creating log:', error);
            throw error;
        }
    }

    static async updateLog(medicineId, logId, logData) {
        try {
            const response = await ApiService.put(`/medicines/${medicineId}/logs/${logId}`, {
                ...logData,
                taken_at: format(new Date(logData.taken_at), "yyyy-MM-dd'T'HH:mm:ss")
            });
            return response.data;
        } catch (error) {
            console.error('Error updating log:', error);
            throw error;
        }
    }

    static async deleteLog(medicineId, logId) {
        try {
            await ApiService.delete(`/medicines/${medicineId}/logs/${logId}`);
        } catch (error) {
            console.error('Error deleting log:', error);
            throw error;
        }
    }

    static async getStats(medicineId, startDate, endDate) {
        try {
            const response = await ApiService.get(`/medicines/${medicineId}/stats`, {
                params: {
                    start_date: format(new Date(startDate), 'yyyy-MM-dd'),
                    end_date: format(new Date(endDate), 'yyyy-MM-dd')
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }
} 