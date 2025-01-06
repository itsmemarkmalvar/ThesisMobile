import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.lastUpdated}>Last updated: January 2024</Text>

            <View style={styles.policySection}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
              <Text style={styles.policyText}>
                We collect information that you provide directly to us, including:
                {'\n\n'}
                • Personal information about your baby (name, birth date, gender)
                {'\n'}
                • Health and development tracking data
                {'\n'}
                • Account information (email, password)
                {'\n'}
                • App usage data
              </Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
              <Text style={styles.policyText}>
                We use the collected information to:
                {'\n\n'}
                • Provide and maintain our services
                {'\n'}
                • Track your baby's growth and development
                {'\n'}
                • Send notifications and updates
                {'\n'}
                • Improve our app and services
              </Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionTitle}>Data Security</Text>
              <Text style={styles.policyText}>
                We implement appropriate security measures to protect your personal information. 
                Your data is encrypted and stored securely. We never share your personal 
                information with third parties without your consent.
              </Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionTitle}>Your Rights</Text>
              <Text style={styles.policyText}>
                You have the right to:
                {'\n\n'}
                • Access your personal data
                {'\n'}
                • Correct inaccurate data
                {'\n'}
                • Request deletion of your data
                {'\n'}
                • Opt-out of communications
              </Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.policyText}>
                If you have any questions about this Privacy Policy, please contact us at:
                {'\n\n'}
                support@babycare.com
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  policySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  policyText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default PrivacyPolicyScreen; 