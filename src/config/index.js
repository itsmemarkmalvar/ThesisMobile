import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',  // For Android Emulator
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
});

export { API_URL }; 