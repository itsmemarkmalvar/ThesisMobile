import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FACEBOOK_APP_ID } from '../config/facebook';
import { Linking } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

class FacebookAuthService {
    login = async () => {
        try {
            const redirectUrl = `fb${FACEBOOK_APP_ID}://authorize`;
            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=token&scope=public_profile,email&display=popup`;

            // Add event listener for handling the redirect
            const handleRedirect = async (event) => {
                if (event.url.startsWith(redirectUrl)) {
                    Linking.removeEventListener('url', handleRedirect);
                    const access_token = event.url.split('#access_token=')[1].split('&')[0];

                    // Get user data using Facebook Graph API
                    const response = await fetch(
                        `https://graph.facebook.com/v18.0/me?access_token=${access_token}&fields=id,name,email,picture.type(large)`
                    );
                    const userData = await response.json();
                    console.log('Facebook user data:', userData);

                    // Call backend to verify and create/update user
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
                }
            };

            // Add event listener
            Linking.addEventListener('url', handleRedirect);

            // Open Facebook login page
            const result = await WebBrowser.openBrowserAsync(authUrl);

            if (result.type === 'cancel') {
                Linking.removeEventListener('url', handleRedirect);
                throw new Error('Facebook login was cancelled');
            }

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    Linking.removeEventListener('url', handleRedirect);
                    reject(new Error('Login timeout'));
                }, 5 * 60 * 1000); // 5 minutes timeout
            });
        } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
        }
    };

    logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Facebook logout error:', error);
            throw error;
        }
    };
}

export default new FacebookAuthService(); 