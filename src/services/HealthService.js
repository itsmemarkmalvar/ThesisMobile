import ApiService from './ApiService';
import { format } from 'date-fns';

export class HealthService {
    // Doctor Visits
    static async getDoctorVisits(startDate, endDate) {
        try {
            const params = {};
            if (startDate && endDate) {
                params.start_date = format(new Date(startDate), 'yyyy-MM-dd');
                params.end_date = format(new Date(endDate), 'yyyy-MM-dd');
            }
            const response = await ApiService.get('/doctor-visits', { params });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching doctor visits:', error);
            throw error;
        }
    }

    static async getDoctorVisit(id) {
        try {
            const response = await ApiService.get(`/doctor-visits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching doctor visit:', error);
            throw error;
        }
    }

    static async createDoctorVisit(visitData) {
        try {
            const response = await ApiService.post('/doctor-visits', {
                ...visitData,
                visit_date: format(new Date(visitData.visit_date), 'yyyy-MM-dd HH:mm:ss'),
                next_visit_date: visitData.next_visit_date ? 
                    format(new Date(visitData.next_visit_date), 'yyyy-MM-dd HH:mm:ss') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error creating doctor visit:', error);
            throw error;
        }
    }

    static async updateDoctorVisit(id, visitData) {
        try {
            const response = await ApiService.put(`/doctor-visits/${id}`, {
                ...visitData,
                visit_date: format(new Date(visitData.visit_date), 'yyyy-MM-dd HH:mm:ss'),
                next_visit_date: visitData.next_visit_date ? 
                    format(new Date(visitData.next_visit_date), 'yyyy-MM-dd HH:mm:ss') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error updating doctor visit:', error);
            throw error;
        }
    }

    static async deleteDoctorVisit(id) {
        try {
            await ApiService.delete(`/doctor-visits/${id}`);
        } catch (error) {
            console.error('Error deleting doctor visit:', error);
            throw error;
        }
    }

    // Health Records
    static async getHealthRecords(startDate, endDate, category, isOngoing) {
        try {
            const params = {};
            if (startDate && endDate) {
                params.start_date = format(new Date(startDate), 'yyyy-MM-dd');
                params.end_date = format(new Date(endDate), 'yyyy-MM-dd');
            }
            if (category) params.category = category;
            if (isOngoing !== undefined) params.is_ongoing = isOngoing;

            const response = await ApiService.get('/health-records', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching health records:', error);
            throw error;
        }
    }

    static async getHealthRecord(id) {
        try {
            const response = await ApiService.get(`/health-records/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching health record:', error);
            throw error;
        }
    }

    static async createHealthRecord(recordData) {
        try {
            const response = await ApiService.post('/health-records', {
                record_date: format(new Date(recordData.record_date), 'yyyy-MM-dd HH:mm:ss'),
                category: recordData.category,
                title: recordData.title,
                description: recordData.description,
                severity: recordData.severity,
                treatment: recordData.treatment,
                notes: recordData.notes,
                is_ongoing: recordData.is_ongoing,
                resolved_at: recordData.resolved_at ? format(new Date(recordData.resolved_at), 'yyyy-MM-dd HH:mm:ss') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error creating health record:', error);
            throw error;
        }
    }

    static async updateHealthRecord(id, recordData) {
        try {
            const response = await ApiService.put(`/health-records/${id}`, {
                ...recordData,
                record_date: format(new Date(recordData.record_date), 'yyyy-MM-dd HH:mm:ss'),
                resolved_at: recordData.resolved_at ? 
                    format(new Date(recordData.resolved_at), 'yyyy-MM-dd HH:mm:ss') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error updating health record:', error);
            throw error;
        }
    }

    static async deleteHealthRecord(id) {
        try {
            await ApiService.delete(`/health-records/${id}`);
        } catch (error) {
            console.error('Error deleting health record:', error);
            throw error;
        }
    }

    // Appointments
    static async getAppointments(startDate, endDate, status) {
        try {
            console.log('Fetching appointments with params:', { startDate, endDate, status });
            const params = {};
            if (startDate && endDate) {
                params.start_date = format(new Date(startDate), 'yyyy-MM-dd');
                params.end_date = format(new Date(endDate), 'yyyy-MM-dd');
            }
            if (status) params.status = status;

            console.log('Making request to /appointments with params:', params);
            const response = await ApiService.get('/appointments', { params });
            console.log('Full appointments response:', JSON.stringify(response.data, null, 2));
            
            // Ensure we return a consistent data structure
            const appointments = Array.isArray(response.data) ? response.data :
                               Array.isArray(response.data?.data) ? response.data.data : [];
            
            console.log('Number of appointments found:', appointments.length);
            appointments.forEach((apt, idx) => {
                console.log(`Appointment ${idx + 1}:`, {
                    id: apt.id,
                    date: apt.appointment_date,
                    status: apt.status,
                    title: apt.title
                });
            });
            
            return { data: appointments };
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    }

    static async getUpcomingAppointments() {
        try {
            console.log('Fetching upcoming appointments...');
            const response = await ApiService.get('/appointments/upcoming');
            console.log('Full upcoming appointments response:', JSON.stringify(response.data, null, 2));
            
            // Return the data array directly if it exists, otherwise return an empty array
            const appointments = Array.isArray(response.data) ? response.data : 
                               Array.isArray(response.data?.data) ? response.data.data : [];
            
            console.log('Number of upcoming appointments:', appointments.length);
            appointments.forEach((apt, idx) => {
                console.log(`Upcoming Appointment ${idx + 1}:`, {
                    id: apt.id,
                    date: apt.appointment_date,
                    status: apt.status,
                    title: apt.title
                });
            });
            
            return { data: appointments };
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error);
            throw error;
        }
    }

    static async getAppointment(id) {
        try {
            const response = await ApiService.get(`/appointments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching appointment:', error);
            throw error;
        }
    }

    static async createAppointment(appointmentData) {
        try {
            const response = await ApiService.post('/appointments', {
                ...appointmentData,
                appointment_date: format(new Date(appointmentData.appointment_date), 'yyyy-MM-dd HH:mm:ss')
            });
            return response.data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    static async updateAppointment(id, appointmentData) {
        try {
            const response = await ApiService.put(`/appointments/${id}`, {
                ...appointmentData,
                appointment_date: format(new Date(appointmentData.appointment_date), 'yyyy-MM-dd HH:mm:ss')
            });
            return response.data;
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    static async deleteAppointment(id) {
        try {
            await ApiService.delete(`/appointments/${id}`);
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }

    // Symptoms
    static async getSymptoms(severity, status) {
        try {
            const params = {};
            if (severity) params.severity = severity;
            if (status) params.status = status;

            const response = await ApiService.get('/symptoms', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching symptoms:', error);
            throw error;
        }
    }

    static async getSymptom(id) {
        try {
            const response = await ApiService.get(`/symptoms/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching symptom:', error);
            throw error;
        }
    }

    static async createSymptom(symptomData) {
        try {
            const response = await ApiService.post('/symptoms', {
                ...symptomData,
                onset_date: symptomData.onset_date,
                resolved_date: symptomData.resolved_date || null
            });
            return response.data;
        } catch (error) {
            console.error('Error creating symptom:', error);
            throw error;
        }
    }

    static async updateSymptom(id, symptomData) {
        try {
            const response = await ApiService.put(`/symptoms/${id}`, {
                ...symptomData,
                onset_date: format(new Date(symptomData.onset_date), 'yyyy-MM-dd HH:mm:ss'),
                resolved_date: symptomData.resolved_date ? 
                    format(new Date(symptomData.resolved_date), 'yyyy-MM-dd HH:mm:ss') : null
            });
            return response.data;
        } catch (error) {
            console.error('Error updating symptom:', error);
            throw error;
        }
    }

    static async deleteSymptom(id) {
        try {
            await ApiService.delete(`/symptoms/${id}`);
        } catch (error) {
            console.error('Error deleting symptom:', error);
            throw error;
        }
    }

    static async getSymptomTrends(symptomId, startDate, endDate) {
        try {
            const params = {
                start_date: format(new Date(startDate), 'yyyy-MM-dd'),
                end_date: format(new Date(endDate), 'yyyy-MM-dd')
            };
            const response = await ApiService.get(`/symptoms/${symptomId}/trends`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching symptom trends:', error);
            throw error;
        }
    }
} 