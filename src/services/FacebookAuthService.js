import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FACEBOOK_APP_ID } from '../config/facebook';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Create the hook outside the class
export const useFacebookAuth = () => {
    return Facebook.useAuthRequest({
        clientId: FACEBOOK_APP_ID,
        responseType: ResponseType.Token,
        redirectUri: 'https://auth.expo.io/@itsmemarkmalvar/binibaby'
    });
};

class FacebookAuthService {
    login = async (promptAsync) => {
        try {
            const result = await promptAsync();

            if (result.type === 'success') {
                const { access_token } = result.params;

                // Get user data from Facebook
                const userDataResponse = await fetch(
                    `https://graph.facebook.com/v18.0/me?access_token=${access_token}&fields=id,name,email,picture.type(large)`
                );
                const userData = await userDataResponse.json();
                console.log('Facebook user data:', userData);

                // Send to backend
                const apiResponse = await axios.post(`${API_URL}/auth/facebook`, {
                    access_token,
                    user_data: userData
                });

                if (apiResponse.data.token) {
                    await AsyncStorage.setItem('userToken', apiResponse.data.token);
                    await AsyncStorage.setItem('userData', JSON.stringify(apiResponse.data.user));
                    
                    return {
                        success: true,
                        user: apiResponse.data.user,
                        token: apiResponse.data.token
                    };
                }
                throw new Error('Failed to get authentication token from server');
            } else if (result.type === 'error') {
                throw new Error(result.error?.message || 'Authentication failed');
            } else {
                throw new Error('Authentication was cancelled or failed');
            }
        } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
        }
    };

    logout = async () => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
        } catch (error) {
            console.error('Facebook logout error:', error);
            throw error;
        }
    };
}

export default new FacebookAuthService(); 