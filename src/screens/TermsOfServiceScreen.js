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

const TermsOfServiceScreen = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.lastUpdated}>Last updated: January 2024</Text>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.termsText}>
                By accessing or using Baby Care, you agree to be bound by these Terms of Service. 
                If you disagree with any part of the terms, you may not access the service.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>2. User Accounts</Text>
              <Text style={styles.termsText}>
                • You are responsible for maintaining the confidentiality of your account
                {'\n'}
                • You must provide accurate and complete information
                {'\n'}
                • You are responsible for all activities under your account
                {'\n'}
                • You must notify us of any security breaches
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>3. Use of Service</Text>
              <Text style={styles.termsText}>
                You agree not to:
                {'\n\n'}
                • Use the service for any unlawful purpose
                {'\n'}
                • Attempt to gain unauthorized access
                {'\n'}
                • Interfere with or disrupt the service
                {'\n'}
                • Share your account credentials
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>4. Data Usage</Text>
              <Text style={styles.termsText}>
                • We collect and store data as outlined in our Privacy Policy
                {'\n'}
                • You retain all rights to your data
                {'\n'}
                • We may use anonymized data for service improvement
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>5. Modifications</Text>
              <Text style={styles.termsText}>
                We reserve the right to modify or replace these Terms at any time. We will provide 
                notice of any changes by posting the new Terms on this screen. Your continued use 
                of the service constitutes acceptance of the new Terms.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>6. Disclaimer</Text>
              <Text style={styles.termsText}>
                The app is provided "as is" without warranties of any kind. We are not responsible 
                for any damages arising from the use of our service.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <Text style={styles.termsText}>
                For any questions about these Terms, please contact us at:
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
  termsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default TermsOfServiceScreen; 