import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <MaterialIcons name="child-care" size={80} color="#4A90E2" />
        <Text style={styles.title}>Binibaby</Text>
        <ActivityIndicator 
          size="large" 
          color="#4A90E2" 
          style={styles.loader}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen; 