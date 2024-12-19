import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import BabyScreen from '../screens/BabyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  // Animation values for each tab
  const tabAnimations = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  const translateY = useRef(new Animated.Value(0)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate the focused tab with enhanced timing and effects
    const focusedAnimation = Animated.spring(tabAnimations[state.index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 80, // Increased tension for snappier animation
      friction: 5,  // Reduced friction for more bounce
      velocity: 3   // Added initial velocity for more dynamic feel
    });
    
    // Reset other tabs with smoother timing
    const resetAnimations = state.routes.map((_, i) => {
      if (i !== state.index) {
        return Animated.spring(tabAnimations[i], {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8
        });
      }
    }).filter(Boolean);

    // Add press feedback animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleY, {
          toValue: 0.95,
          useNativeDriver: true,
          duration: 100,
        }),
        Animated.spring(translateY, {
          toValue: 2,
          useNativeDriver: true,
          duration: 100,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleY, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 3,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 3,
        }),
      ]),
    ]).start();

    Animated.parallel([focusedAnimation, ...resetAnimations]).start();
  }, [state.index]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.tabBarContainer,
          {
            transform: [
              { translateY },
              { scaleY }
            ]
          }
        ]}
      >
        <View style={styles.tabBarBackground} />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Enhanced press animation
              Animated.sequence([
                Animated.parallel([
                  Animated.timing(tabAnimations[index], {
                    toValue: 0.9,
                    duration: 50,
                    useNativeDriver: true,
                  }),
                  Animated.timing(scaleY, {
                    toValue: 0.97,
                    duration: 50,
                    useNativeDriver: true,
                  }),
                ]),
                Animated.parallel([
                  Animated.spring(tabAnimations[index], {
                    toValue: 1,
                    tension: 80,
                    friction: 4,
                    useNativeDriver: true,
                  }),
                  Animated.spring(scaleY, {
                    toValue: 1,
                    tension: 60,
                    friction: 3,
                    useNativeDriver: true,
                  }),
                ]),
              ]).start();

              navigation.navigate(route.name);
            }
          };

          const animatedIconStyle = {
            transform: [
              {
                scale: tabAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
              {
                translateY: tabAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3], // Slight upward movement when active
                }),
              },
            ],
          };

          const animatedBackgroundStyle = {
            opacity: tabAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            transform: [
              {
                scale: tabAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Animated.View style={[styles.tabItem]}>
                <Animated.View 
                  style={[
                    styles.iconContainer, 
                    animatedIconStyle,
                    isFocused && styles.iconContainerFocused
                  ]}
                >
                  {options.tabBarIcon({ 
                    focused: isFocused,
                    color: isFocused ? '#FFFFFF' : '#9E9E9E',
                    size: 24 
                  })}
                </Animated.View>
                <Animated.Text 
                  style={[
                    styles.tabLabel,
                    { 
                      color: isFocused ? '#4A90E2' : '#9E9E9E',
                      opacity: tabAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                      transform: [
                        {
                          scale: tabAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                        {
                          translateY: tabAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -2],
                          }),
                        },
                      ],
                    }
                  ]}
                >
                  {label}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        },
        // Add screen transition animations
        animation: 'fade',
        presentation: 'card',
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Baby"
        component={BabyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="child-care" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginHorizontal: 10,
    height: 70,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 15,
    position: 'relative',
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    opacity: 0.98,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    width: 60,
    height: 50,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backfaceVisibility: 'hidden',
  },
  iconContainerFocused: {
    backgroundColor: '#4A90E2',
    transform: [{ scale: 1.1 }],
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default MainNavigator; 