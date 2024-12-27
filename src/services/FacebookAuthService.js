import * as Facebook from 'expo-facebook';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FACEBOOK_APP_ID = '1241435060269374';

class FacebookAuthService {
    init = async () => {
        try {
            console.log('Initializing Facebook SDK...');
            await Facebook.initializeAsync({
                appId: FACEBOOK_APP_ID,
                appName: 'BINIBABY',
                // Add these required configurations
                autoLogAppEvents: true,
                clientToken: 'da5156fc8ec1b349e30fe4fe33d081b4',
                scheme: Platform.select({
                    ios: 'fb1241435060269374',
                    android: 'fb1241435060269374'
                })
            });
            console.log('Facebook SDK initialized successfully');
        } catch (e) {
            console.error('Facebook initialization detailed error:', {
                message: e.message,
                code: e.code,
                stack: e.stack
            });
            throw new Error(`Failed to initialize Facebook SDK: ${e.message}`);
        }
    };

    login = async () => {
        try {
            // First, try to log in with Facebook
            const { type, token, expirationDate } = await Facebook.logInWithReadPermissionsAsync({
                permissions: ['public_profile', 'email'],
            });

            if (type === 'success') {
                // Get user data from Facebook
                const response = await fetch(
                    `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.type(large)`
                );
                const userData = await response.json();

                // Call backend to verify and create/update user
                const apiResponse = await axios.post(`${API_URL}/auth/facebook`, {
                    token: token,
                    userData: userData
                });

                if (apiResponse.data.token) {
                    // Store the authentication token
                    await AsyncStorage.setItem('userToken', apiResponse.data.token);
                    
                    // Store user data
                    await AsyncStorage.setItem('userData', JSON.stringify(apiResponse.data.user));
                    
                    return {
                        success: true,
                        user: apiResponse.data.user,
                        token: apiResponse.data.token
                    };
                }
                throw new Error('Failed to get authentication token from server');
            } else if (type === 'cancel') {
                throw new Error('Facebook login was cancelled');
            } else {
                throw new Error('Facebook login failed');
            }
        } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
        }
    };

    logout = async () => {
        try {
            await Facebook.logOutAsync();
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Facebook logout error:', error);
            throw error;
        }
    };
}

export default new FacebookAuthService(); 