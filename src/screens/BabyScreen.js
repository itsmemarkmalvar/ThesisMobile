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
import { useBaby } from '../context/BabyContext';

// Get screen width
const { width } = Dimensions.get('window');

const BabyScreen = ({ navigation, route }) => {
  const { babyData, loading, error, fetchBabyData, updateBabyData } = useBaby();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      }
    })();
  }, []);

  // Only fetch data if we don't have it
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!babyData && !error) {
        try {
          console.log('[BabyScreen] Initial fetch - no data available');
          await fetchBabyData();
        } catch (error) {
          console.error('[BabyScreen] Initial fetch error:', error);
          if (mounted) {
            // Show error alert only if it's not a network error
            if (!error.message.includes('Network Error')) {
              Alert.alert(
                'Error',
                'Failed to load baby data. Please check your connection and try again.'
              );
            }
          }
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle focus events and updates
  useEffect(() => {
    let mounted = true;

    const handleFocus = async (params) => {
      if (!mounted) return;

      if (params?.dataUpdated || params?.photoUpdated) {
        try {
          console.log('[BabyScreen] Fetching due to update:', params);
          await fetchBabyData(true);
        } catch (error) {
          console.error('[BabyScreen] Focus fetch error:', error);
          if (mounted) {
            Alert.alert(
              'Error',
              'Failed to refresh data. Please try again.'
            );
          }
        }
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      const params = route.params;
      handleFocus(params);
      // Clear the parameters
      if (params?.dataUpdated || params?.photoUpdated) {
        navigation.setParams({
          dataUpdated: undefined,
          photoUpdated: undefined
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigation, route.params]);

  const resizeImage = async (uri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      console.log('Image resized:', {
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
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        const resizedImage = await resizeImage(result.assets[0].uri);
        await uploadImage(resizedImage);
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
      
      if (!imageAsset?.uri) {
        throw new Error('Invalid image data');
      }

      console.log('Preparing image upload:', {
        uri: imageAsset.uri,
        width: imageAsset.width,
        height: imageAsset.height,
      });

      const formData = new FormData();
      formData.append('photo', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'baby_photo.jpg',
      });

      const response = await axios.post(`${API_URL}/baby/upload-photo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      console.log('Upload response:', response.data);

      // Check if the response has data and photo_url
      if (response.data && response.data.photo_url) {
        setImageError(false);
        // Update local state immediately
        updateBabyData({ ...babyData, photo_url: response.data.photo_url });
        Alert.alert('Success', response.data.message || 'Photo uploaded successfully!');
      } else if (response.data && response.data.message) {
        throw new Error(response.data.message);
      } else {
        throw new Error('Failed to upload photo: No response data');
      }
    } catch (error) {
      console.error('Upload error:', {
        message: error.message,
        response: error.response?.data || 'No response data'
      });
      Alert.alert(
        'Error', 
        error.response?.data?.message || error.message || 'Failed to upload photo. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const renderBabyImage = () => {
    // Validate base64 image URL
    const isValidBase64Image = (url) => {
      if (!url) {
        console.log('No photo URL provided');
        return false;
      }
      try {
        // Log the URL details
        console.log('Validating image URL:', {
          urlLength: url.length,
          urlPrefix: url.substring(0, 50),
          isBase64: url.startsWith('data:image/')
        });

        // Check if it's a valid data URL format
        if (!url.startsWith('data:image/')) {
          console.log('URL does not start with data:image/');
          return false;
        }

        // Extract the base64 part
        const base64Match = url.match(/^data:image\/\w+;base64,(.+)$/);
        if (!base64Match) {
          console.log('URL does not match base64 pattern');
          return false;
        }

        // Get base64 data and add padding if needed
        const base64Data = base64Match[1];
        const padding = base64Data.length % 4;
        if (padding > 0) {
          const paddedUrl = url.slice(0, url.lastIndexOf(',') + 1) + 
            base64Data + '='.repeat(4 - padding);
          
          console.log('Base64 validation result:', {
            originalLength: base64Data.length,
            paddedLength: paddedUrl.length,
            padding: 4 - padding
          });
          
          return true;
        }

        return true;
      } catch (error) {
        console.error('Error validating base64 image:', {
          error: error.message,
          stack: error.stack
        });
        return false;
      }
    };

    // Render placeholder for no image or error
    const renderPlaceholder = (icon = "photo-camera") => (
      <View style={[styles.photoPlaceholder, { width: 120, height: 120, borderRadius: 60 }]}>
        <LinearGradient
          colors={['#FF9A9E', '#FAD0C4']}
          style={{ width: '100%', height: '100%', borderRadius: 60, justifyContent: 'center', alignItems: 'center' }}
        >
          <MaterialIcons name={icon} size={40} color="#FFF" />
        </LinearGradient>
      </View>
    );

    if (!babyData?.photo_url) {
      console.log('No photo URL in babyData');
      return renderPlaceholder("photo-camera");
    }

    if (imageError) {
      console.log('Image error state is true');
      return renderPlaceholder("broken-image");
    }

    const isValid = isValidBase64Image(babyData.photo_url);
    if (!isValid) {
      console.error('Invalid base64 image format');
      return renderPlaceholder("broken-image");
    }

    return (
      <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden' }}>
        <Image
          source={{ 
            uri: babyData.photo_url,
            cache: 'reload'
          }}
          style={{ width: '100%', height: '100%' }}
          onLoadStart={() => {
            console.log('Image load started');
            setImageError(false);
          }}
          onLoadEnd={() => {
            console.log('Image load completed');
          }}
          onError={(e) => {
            console.error('Image loading error:', {
              error: e.nativeEvent,
              urlLength: babyData.photo_url?.length,
              urlPrefix: babyData.photo_url?.substring(0, 50)
            });
            setImageError(true);
          }}
        />
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  const handleRetry = async () => {
    try {
      console.log('[BabyScreen] Manual retry requested');
      await fetchBabyData(true);
    } catch (error) {
      console.error('[BabyScreen] Retry error:', error);
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
          onPress={handleRetry}
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
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.photoContainer}>
              {renderBabyImage()}
              {!uploading && (
                <TouchableOpacity 
                  style={styles.editPhotoButton} 
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <MaterialIcons 
                    name="add-a-photo" 
                    size={22} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFF" />
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.babyName}>{babyData.name}</Text>
              <Text style={styles.babyAge}>
                {calculateAge(babyData.birth_date)}
              </Text>
            </View>

            {/* Quick Stats */}
            <TouchableOpacity 
              style={styles.statsContainer}
              onPress={() => navigation.navigate('GrowthTracking')}
            >
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
            </TouchableOpacity>
          </View>

          {/* Details Cards */}
          <View style={styles.detailsContainer}>
            {/* Basic Info Card */}
            <View style={styles.detailCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Basic Information</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditBaby', { babyData })}
                >
                  <MaterialIcons name="edit-note" size={24} color="#4A90E2" />
                </TouchableOpacity>
              </View>
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
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 10,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  photoPlaceholder: {
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  editPhotoButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: '#4A90E2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(2px)',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  babyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  babyAge: {
    fontSize: 17,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginTop: 24,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(224, 224, 224, 0.8)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    marginLeft: 12,
  },
  cardContent: {
    gap: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(248, 250, 255, 0.7)',
    borderRadius: 15,
    padding: 16,
  },
  infoTextContainer: {
    marginLeft: 18,
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 17,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
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
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 255, 0.9)',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 255, 0.9)',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
  },
  updateText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BabyScreen; 