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
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If the error is not 401 or it's already been retried, reject it
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // If token refresh is already in progress, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve) => {
            this.requestQueue.push(() => {
              resolve(this.axiosInstance(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          // Clear the token and redirect to login
          await AsyncStorage.removeItem('userToken');
          this.isRefreshing = false;
          
          // Process the queued requests
          this.requestQueue.forEach((callback) => callback());
          this.requestQueue = [];
          
          return Promise.reject(new Error('SESSION_EXPIRED'));
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    );
  }

  async request(method, endpoint, data = null, retries = 2) {
    try {
      const config = {
        method,
        url: endpoint,
        ...(data && { data })
      };

      return await this.axiosInstance(config);
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        throw error;
      }

      if (retries > 0 && !error.response) {
        // Only retry on network errors, not on 4xx or 5xx responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(method, endpoint, data, retries - 1);
      }

      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request('GET', endpoint);
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