import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Get screen width
const { width } = Dimensions.get('window');

const BabyScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [babyData, setBabyData] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      }
    })();
  }, []);

  useEffect(() => {
    fetchBabyData();
  }, []);

  // Handle refresh from route params
  useEffect(() => {
    if (route?.params?.refresh) {
      fetchBabyData();
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh]);

  const fetchBabyData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Retrieved token:', token);

      if (!token) {
        console.log('No token found, redirecting to login');
        navigation.replace('Auth');
        return;
      }

      const response = await axios.get(`${API_URL}/baby`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Baby data response:', {
        status: response.status,
        hasData: !!response.data.data,
        hasPhoto: !!response.data.data?.photo_url
      });

      // Check if response.data.data exists (this is the structure from your API)
      if (response.data.data) {
        // Validate photo_url if it exists
        const babyDataWithValidation = {
          ...response.data.data,
          photo_url: response.data.data.photo_url || null,
          parent_name: 'Parent'
        };

        console.log('Processed baby data:', {
          name: babyDataWithValidation.name,
          hasPhoto: !!babyDataWithValidation.photo_url,
          photoStart: babyDataWithValidation.photo_url?.substring(0, 30)
        });

        setBabyData(babyDataWithValidation);
        setError(null);
      } else {
        setError('No baby data available');
      }
    } catch (error) {
      console.error('Error fetching baby data:', error.response || error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Auth');
      } else {
        setError('Error loading baby data');
      }
    } finally {
      setLoading(false);
    }
  };

  const resizeImage = async (uri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 500 } }, // Resize to width of 500px, height will adjust to maintain aspect ratio
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      console.log('Resized image:', {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
      });
      
      return manipulatedImage;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // Get full quality, we'll resize it ourselves
      });

      console.log('Image picker result:', {
        cancelled: result.canceled,
        type: result.assets?.[0]?.type,
        size: result.assets?.[0]?.fileSize,
      });

      if (!result.canceled && result.assets?.[0]) {
        const resizedImage = await resizeImage(result.assets[0].uri);
        uploadImage(resizedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      console.log('Preparing image for upload:', {
        uri: imageAsset.uri,
        width: imageAsset.width,
        height: imageAsset.height,
      });

      // Create form data
      const formData = new FormData();
      formData.append('photo', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'baby_photo.jpg',
      });

      console.log('Sending request to:', `${API_URL}/baby/upload-photo`);

      const response = await axios.post(`${API_URL}/baby/upload-photo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        // Refresh baby data to get updated photo URL
        fetchBabyData();
        Alert.alert('Success', 'Photo uploaded successfully!');
      }
    } catch (error) {
      console.error('❌ Response error:', JSON.stringify({
        code: error.code,
        message: error.message,
        response: error.response?.data,
        url: error.config?.url
      }, null, 2));
      Alert.alert(
        'Error',
        'Failed to upload photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (error || !babyData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'No baby data available'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBabyData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF9A9E', '#FAD0C4', '#FFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Header with Blur Effect */}
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Baby Details</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('EditBaby', { babyData })}
              >
                <MaterialIcons name="edit" size={22} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={pickImage}
              disabled={uploading}
            >
              {babyData?.photo_url ? (
                (() => {
                  console.log('Baby photo data:', {
                    photoExists: !!babyData.photo_url,
                    photoLength: babyData.photo_url?.length,
                    photoStart: babyData.photo_url?.substring(0, 50),
                    photoEnd: babyData.photo_url?.substring(-50)
                  });

                  // Validate base64 format
                  const isValidBase64 = (str) => {
                    if (!str) return false;
                    try {
                      // Check if it's a data URL
                      if (str.startsWith('data:image/')) {
                        return true;
                      }
                      return false;
                    } catch (e) {
                      console.error('Base64 validation error:', e);
                      return false;
                    }
                  };

                  if (!isValidBase64(babyData.photo_url)) {
                    console.log('Invalid base64 image data');
                    return (
                      <LinearGradient
                        colors={['#4A90E2', '#357ABD']}
                        style={styles.avatarGradient}
                      >
                        <MaterialIcons name="child-care" size={50} color="#FFF" />
                      </LinearGradient>
                    );
                  }

                  return (
                    <Image
                      source={{ uri: babyData.photo_url }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onLoadStart={() => console.log('Image loading started')}
                      onLoadEnd={() => console.log('Image loading completed')}
                      onError={(error) => {
                        console.error('Image loading error:', error.nativeEvent.error);
                      }}
                    />
                  );
                })()
              ) : (
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.avatarGradient}
                >
                  <MaterialIcons name="child-care" size={50} color="#FFF" />
                </LinearGradient>
              )}
              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : (
                <View style={styles.cameraIconContainer}>
                  <MaterialIcons name="camera-alt" size={20} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.nameContainer}>
              <Text style={styles.babyName}>{babyData.name}</Text>
              <Text style={styles.babyAge}>
                {calculateAge(babyData.birth_date)}
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialIcons name="straighten" size={24} color="#4A90E2" />
                <Text style={styles.statValue}>{babyData.height}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="monitor-weight" size={24} color="#4A90E2" />
                <Text style={styles.statValue}>{babyData.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="radio-button-checked" size={24} color="#4A90E2" />
                <Text style={styles.statValue}>{babyData.head_size}</Text>
                <Text style={styles.statLabel}>cm</Text>
              </View>
            </View>
          </View>

          {/* Details Cards */}
          <View style={styles.detailsContainer}>
            {/* Basic Info Card */}
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>Basic Information</Text>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="cake" size={20} color="#4A90E2" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Birth Date</Text>
                    <Text style={styles.infoValue}>
                      {new Date(babyData.birth_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="face" size={20} color="#4A90E2" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>
                      {babyData.gender.charAt(0).toUpperCase() + babyData.gender.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* History Card */}
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>History</Text>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={20} color="#4A90E2" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Created On</Text>
                    <Text style={styles.infoValue}>
                      {new Date(babyData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="update" size={20} color="#4A90E2" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Last Updated</Text>
                    <Text style={styles.infoValue}>
                      {new Date(babyData.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Helper function to calculate age
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  const monthDiff = today.getMonth() - birth.getMonth();
  const yearDiff = today.getFullYear() - birth.getFullYear();
  const ageInMonths = yearDiff * 12 + monthDiff;
  
  if (ageInMonths < 1) {
    const dayDiff = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    return `${dayDiff} days old`;
  } else if (ageInMonths < 24) {
    return `${ageInMonths} months old`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months > 0 ? `${years} years, ${months} months old` : `${years} years old`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    alignItems: 'center',
  },
  babyName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  babyAge: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 15,
    padding: 16,
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardContent: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#4A90E2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default BabyScreen; 