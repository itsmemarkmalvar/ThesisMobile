import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const BabyNameGenderScreen = ({ navigation }) => {
  const [babyName, setBabyName] = useState('');
  const [gender, setGender] = useState(null);

  const handleNext = () => {
    if (!babyName.trim()) {
      Alert.alert('Required', 'Please enter your baby\'s name');
      return;
    }
    if (!gender) {
      Alert.alert('Required', 'Please select your baby\'s gender');
      return;
    }

    navigation.navigate('BabyBirth', { babyName, gender });
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '33.33%' }]} />
              </View>
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>

            <Text style={styles.title}>Let's get to know your baby</Text>
            <Text style={styles.subtitle}>First, what's your baby's name?</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter baby's name"
                value={babyName}
                onChangeText={setBabyName}
                placeholderTextColor="#999"
                maxLength={50}
              />
            </View>

            {/* Gender Selection */}
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonSelected
                ]}
                onPress={() => setGender('male')}
              >
                <MaterialIcons
                  name="male"
                  size={24}
                  color={gender === 'male' ? '#FFF' : '#4A90E2'}
                />
                <Text style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextSelected
                ]}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonSelected
                ]}
                onPress={() => setGender('female')}
              >
                <MaterialIcons
                  name="female"
                  size={24}
                  color={gender === 'female' ? '#FFF' : '#4A90E2'}
                />
                <Text style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextSelected
                ]}>Female</Text>
              </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.nextButton, (!babyName || !gender) && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!babyName || !gender}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 20 : 0,
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  stepText: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  genderButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#FFF',
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BabyNameGenderScreen; 