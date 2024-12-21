import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';

const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIcon}>
      <MaterialIcons name={icon} size={24} color="#4A90E2" />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />}
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <SettingItem
            icon="notifications-none"
            title="Push Notifications"
            subtitle={notificationsEnabled ? "Enabled" : "Disabled"}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#D1D1D6", true: "#4A90E2" }}
                thumbColor={Platform.OS === 'ios' ? "#FFFFFF" : notificationsEnabled ? "#FFFFFF" : "#F4F3F4"}
              />
            }
          />
          <SettingItem
            icon="dark-mode"
            title="Dark Mode"
            subtitle={darkMode ? "On" : "Off"}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#D1D1D6", true: "#4A90E2" }}
                thumbColor={Platform.OS === 'ios' ? "#FFFFFF" : darkMode ? "#FFFFFF" : "#F4F3F4"}
              />
            }
          />
          <SettingItem
            icon="language"
            title="Language"
            subtitle="English (US)"
          />
          <SettingItem
            icon="access-time"
            title="Time Zone"
            subtitle="GMT+8"
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingItem
            icon="lock-outline"
            title="Change Password"
            subtitle="Last changed 3 months ago"
          />
          <SettingItem
            icon="fingerprint"
            title="Biometric Login"
            subtitle="Enable face or fingerprint login"
          />
          <SettingItem
            icon="security"
            title="App Lock"
            subtitle="Require authentication to open app"
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-outline"
            title="Help Center"
            subtitle="FAQs and support resources"
          />
          <SettingItem
            icon="info-outline"
            title="About"
            subtitle="Version 1.0.0"
          />
          <SettingItem
            icon="policy"
            title="Privacy Policy"
          />
          <SettingItem
            icon="description"
            title="Terms of Service"
          />
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#FF4B4B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFF',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  accountActions: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8E8',
    marginBottom: 12,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
  },
  deleteAccountButton: {
    padding: 15,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 14,
    color: '#FF4B4B',
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen; 