import { Platform } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

const LOCAL_IP = '192.168.100.31';

// Get the current environment
const getEnvironment = () => {
  if (Constants.expoConfig?.extra?.isStandalone) {
    return 'standalone';
  }
  if (Platform.OS === 'web') {
    return 'web';
  }
  if (Constants.appOwnership === 'expo') {
    return 'expo';
  }
  return 'development';
};

// Configure API URL based on environment
const getApiUrl = () => {
  const environment = getEnvironment();
  console.log('Current environment:', environment);
  
  // Production URL for all environments
  return 'https://binibaby-api.com/api';
};

export const API_URL = getApiUrl();

console.log('Selected API URL:', API_URL);

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    console.log('🌐 Making request to:', config.url);
    console.log('📡 Request headers:', config.headers);
    return config;
  },
  error => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('✅ Response received from:', response.config.url);
    return response;
  },
  error => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Export other configuration constants
export const APP_CONFIG = {
  isProduction: !__DEV__,
  apiUrl: API_URL,
  environment: getEnvironment(),
  network: {
    timeout: 10000,
    retries: 3
  }
}; 