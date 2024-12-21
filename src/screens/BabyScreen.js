import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const MetricCard = ({ icon, value, unit, label }) => (
  <View style={styles.metricCard}>
    <MaterialIcons name={icon} size={24} color="#4A90E2" />
    <View style={styles.metricValue}>
      <Text style={styles.metricNumber}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const MilestoneItem = ({ title, date, completed }) => (
  <View style={styles.milestoneItem}>
    <View style={[styles.milestoneIcon, completed && styles.milestoneIconCompleted]}>
      <MaterialIcons 
        name={completed ? "check" : "schedule"} 
        size={20} 
        color={completed ? "#FFF" : "#4A90E2"} 
      />
    </View>
    <View style={styles.milestoneContent}>
      <Text style={styles.milestoneTitle}>{title}</Text>
      <Text style={styles.milestoneDate}>{date}</Text>
    </View>
    {completed && (
      <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
    )}
  </View>
);

const BabyScreen = () => {
  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Baby Profile</Text>
            <TouchableOpacity style={styles.editButton}>
              <MaterialIcons name="edit" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Baby Info */}
            <View style={styles.babyInfo}>
              <View style={styles.babyImageContainer}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/120' }}
                  style={styles.babyImage}
                />
                <TouchableOpacity style={styles.cameraButton}>
                  <MaterialIcons name="camera-alt" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.babyName}>Emma</Text>
              <Text style={styles.babyAge}>8 months old</Text>
              <Text style={styles.babyDOB}>Born: August 15, 2023</Text>
            </View>

            {/* Growth Metrics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Growth Tracking</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See History</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.metricsContainer}>
                <MetricCard
                  icon="straighten"
                  value="68"
                  unit="cm"
                  label="Height"
                />
                <MetricCard
                  icon="fitness-center"
                  value="7.2"
                  unit="kg"
                  label="Weight"
                />
                <MetricCard
                  icon="radio-button-checked"
                  value="43"
                  unit="cm"
                  label="Head Size"
                />
              </View>
            </View>

            {/* Next Checkup */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Next Checkup</Text>
              </View>
              <TouchableOpacity style={styles.checkupCard}>
                <View style={styles.checkupIcon}>
                  <MaterialIcons name="event" size={24} color="#4A90E2" />
                </View>
                <View style={styles.checkupInfo}>
                  <Text style={styles.checkupTitle}>9-Month Checkup</Text>
                  <Text style={styles.checkupDate}>May 15, 2024 • 10:00 AM</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />
              </TouchableOpacity>
            </View>

            {/* Milestones */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Milestones</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.milestonesList}>
                <MilestoneItem
                  title="First Smile"
                  date="2 months old"
                  completed={true}
                />
                <MilestoneItem
                  title="Rolling Over"
                  date="4 months old"
                  completed={true}
                />
                <MilestoneItem
                  title="First Words"
                  date="Expected: 9-12 months"
                  completed={false}
                />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FFE8E8' }]}>
                    <MaterialIcons name="medication" size={24} color="#FF4B4B" />
                  </View>
                  <Text style={styles.actionText}>Vaccinations</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8F5FF' }]}>
                    <MaterialIcons name="restaurant" size={24} color="#4A90E2" />
                  </View>
                  <Text style={styles.actionText}>Feeding</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8FFF1' }]}>
                    <MaterialIcons name="king-bed" size={24} color="#00C853" />
                  </View>
                  <Text style={styles.actionText}>Sleep</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.5)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  babyInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.5)',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  babyImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  babyImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#4A90E2',
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cameraButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#4A90E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  babyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  babyAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  babyDOB: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 12,
    borderRadius: 20,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeAllButton: {
    padding: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 16,
    width: (width - 96) / 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 6,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricUnit: {
    fontSize: 13,
    color: '#666',
    marginLeft: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkupInfo: {
    flex: 1,
  },
  checkupTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  checkupDate: {
    fontSize: 14,
    color: '#666',
  },
  milestonesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  milestoneIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 96) / 3,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default BabyScreen; 