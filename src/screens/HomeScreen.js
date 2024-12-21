import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const LoadingPlaceholder = ({ style }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
          backgroundColor: '#E0E0E0',
          borderRadius: 8,
        },
      ]}
    />
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const tipsScrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      startEntryAnimation();
    }, 1500);
  }, []);

  const startEntryAnimation = () => {
    // Initial animations sequence
    Animated.sequence([
      // First fade in the header
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      // Then animate the baby card
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // Stagger the quick actions buttons
      Animated.stagger(50, quickActionsAnim.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      )),
      // Finally slide up the content
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a data refresh
    setTimeout(() => {
      setRefreshing(false);
      // Restart animations after refresh
      startEntryAnimation();
    }, 2000);
  }, []);

  // Header parallax effect
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pressAnimation = (scale) => {
    return {
      transform: [
        {
          scale: scale.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.92],
          }),
        },
      ],
    };
  };

  const createPressHandler = (scale, onPress) => {
    const animatedScale = new Animated.Value(0);
    return {
      onPressIn: () => {
        Animated.spring(animatedScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      onPressOut: () => {
        Animated.spring(animatedScale, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      onPress,
      style: pressAnimation(animatedScale),
    };
  };

  // Navigation transition handler
  const navigateWithAnimation = (screenName) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(screenName);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <LoadingPlaceholder style={{ width: 150, height: 50 }} />
          <LoadingPlaceholder style={{ width: 40, height: 40, borderRadius: 20 }} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingPlaceholder style={styles.babyCard} />
          <View style={styles.quickActionsContainer}>
            {[...Array(8)].map((_, index) => (
              <LoadingPlaceholder
                key={index}
                style={{
                  width: width * 0.2,
                  height: 80,
                  marginBottom: 10,
                  marginHorizontal: 10,
                }}
              />
            ))}
          </View>
          <LoadingPlaceholder style={{ height: 100, marginHorizontal: 20, marginTop: 20 }} />
          <LoadingPlaceholder style={{ height: 100, marginHorizontal: 20, marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFB6C1', '#E6E6FA', '#98FB98']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Animated Header */}
        <Animated.View style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          }
        ]}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>Sarah Johnson</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={28} color="#4A90E2" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={20}
              tintColor="#4A90E2"
              colors={['#4A90E2']}
            />
          }
        >
          {/* Baby Card */}
          <Animated.View style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              {...createPressHandler(new Animated.Value(0))}
            >
              <View style={styles.babyCard}>
                <View style={styles.babyInfo}>
                  <View>
                    <Text style={styles.babyCardTitle}>Baby Emma</Text>
                    <Text style={styles.babyAge}>8 months old</Text>
                  </View>
                  <View style={styles.babyStats}>
                    <View style={styles.statItem}>
                      <FontAwesome5 name="weight" size={16} color="#4A90E2" />
                      <Text style={styles.statText}>7.2 kg</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialIcons name="height" size={18} color="#4A90E2" />
                      <Text style={styles.statText}>68 cm</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FFE8E8' }]}>
                    <FontAwesome5 name="baby" size={20} color="#FF4B4B" />
                  </View>
                  <Text style={styles.actionText}>Daily Care</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8F5FF' }]}>
                    <MaterialIcons name="event-note" size={22} color="#4A90E2" />
                  </View>
                  <Text style={styles.actionText}>Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#E8FFF1' }]}>
                    <MaterialIcons name="show-chart" size={22} color="#00C853" />
                  </View>
                  <Text style={styles.actionText}>Growth</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FFF0E8' }]}>
                    <MaterialIcons name="medical-services" size={22} color="#FF9500" />
                  </View>
                  <Text style={styles.actionText}>Health</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scheduleList}>
              <TouchableOpacity style={styles.scheduleItem}>
                <View style={[styles.scheduleIcon, { backgroundColor: '#FFE8E8' }]}>
                  <MaterialIcons name="medication" size={24} color="#FF4B4B" />
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>Vaccination</Text>
                  <Text style={styles.scheduleTime}>10:00 AM</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.scheduleItem}>
                <View style={[styles.scheduleIcon, { backgroundColor: '#E8F5FF' }]}>
                  <MaterialIcons name="restaurant" size={24} color="#4A90E2" />
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>Feeding Time</Text>
                  <Text style={styles.scheduleTime}>12:30 PM</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#C4C4C4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Parenting Tips</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tipsContainer}
            >
              <TouchableOpacity style={styles.tipCard}>
                <View style={[styles.tipCardContent, { backgroundColor: '#FFE8E8' }]}>
                  <MaterialIcons name="lightbulb" size={24} color="#FF4B4B" />
                  <Text style={styles.tipTitle}>Sleep Training</Text>
                  <Text style={styles.tipDescription}>Essential tips for better baby sleep</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tipCard}>
                <View style={[styles.tipCardContent, { backgroundColor: '#E8F5FF' }]}>
                  <MaterialIcons name="child-care" size={24} color="#4A90E2" />
                  <Text style={styles.tipTitle}>First Foods</Text>
                  <Text style={styles.tipDescription}>Guide to baby's first solid foods</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tipCard}>
                <View style={[styles.tipCardContent, { backgroundColor: '#E8FFF1' }]}>
                  <MaterialIcons name="spa" size={24} color="#00C853" />
                  <Text style={styles.tipTitle}>Baby Massage</Text>
                  <Text style={styles.tipDescription}>Techniques for calming and bonding</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 240, 240, 0.5)',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 20,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  // ... rest of your existing styles with updated backgrounds to rgba(255, 255, 255, 0.9)
  // and adding subtle shadows where appropriate

  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B4B',
  },
  babyCard: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  babyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  babyCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  babyAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  babyStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 80) / 4,
    marginBottom: 16,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
        elevation: 3,
      },
    }),
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  scheduleList: {
    gap: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
        elevation: 4,
      },
    }),
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  tipCard: {
    width: width * 0.7,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
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
        elevation: 5,
      },
    }),
  },
  tipCardContent: {
    padding: 20,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen; 