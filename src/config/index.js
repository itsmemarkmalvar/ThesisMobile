import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: __DEV__ 
    ? 'http://10.0.2.2:8000/api'          // Android Emulator
    : 'http://192.168.100.31:8000/api',   // Physical Device
  ios: 'http://localhost:8000/api',        // iOS Simulator
  default: 'http://10.0.2.2:8000/api'      
});

export { API_URL }; 