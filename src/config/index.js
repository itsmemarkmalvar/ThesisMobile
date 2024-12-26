import { Platform } from 'react-native';

export const API_URL = Platform.select({
  ios: 'http://localhost:8000/api',      // For iOS Simulator
  android: 'http://10.0.2.2:8000/api',   // For Android Emulator
  default: 'http://10.0.2.2:8000/api'    // Default to Android
}); 