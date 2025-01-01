import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

class ApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    this.requestQueue = [];
    this.isRefreshing = false;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Making request to:', config.url);
        console.log('Request headers:', config.headers);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token found and added to headers');
        } else {
          console.log('No token found');
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('Response received from:', response.config.url);
        console.log('Response status:', response.status);
        return response;
      },
      async (error) => {
        console.error('Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        const originalRequest = error.config;

        // If the error is not 401 or it's already been retried, reject it
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // If token refresh is already in progress, queue this request
        if (this.isRefreshing) {
          console.log('Token refresh in progress, queueing request');
          return new Promise((resolve) => {
            this.requestQueue.push(() => {
              resolve(this.axiosInstance(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;
        console.log('Attempting to refresh token');

        try {
          // Try to refresh the token
          const refreshResponse = await this.axiosInstance.post('/auth/refresh');
          const { token } = refreshResponse.data;

          if (token) {
            console.log('Token refreshed successfully');
            // Save the new token
            await AsyncStorage.setItem('userToken', token);
            
            // Update the Authorization header
            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            originalRequest.headers['Authorization'] = `Bearer ${token}`;

            // Process the queued requests with the new token
            console.log('Processing queued requests:', this.requestQueue.length);
            this.requestQueue.forEach(callback => callback());
            this.requestQueue = [];
            
            // Retry the original request
            return this.axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, clear everything and redirect to login
          await AsyncStorage.removeItem('userToken');
          this.requestQueue = [];
          return Promise.reject(new Error('SESSION_EXPIRED'));
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  async request(method, endpoint, data = null, retries = 2, config = {}) {
    try {
      const requestConfig = {
        method,
        url: endpoint,
        ...config,
        ...(data && { data })
      };

      console.log('Making request with config:', requestConfig);

      return await this.axiosInstance(requestConfig);
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        throw error;
      }

      if (retries > 0 && !error.response) {
        // Only retry on network errors, not on 4xx or 5xx responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(method, endpoint, data, retries - 1, config);
      }

      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, config = {}) {
    return this.request('GET', endpoint, null, 2, config);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}

export default new ApiService(); 