import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const categories = [
  {
    id: 'motor',
    title: 'Motor Skills',
    icon: 'sports-handball',
    color: '#4CAF50',
    description: 'Track fine and gross motor development',
    activities: [
      { id: 1, title: 'Hand-eye Coordination', description: 'Ability to grasp and manipulate objects' },
      { id: 2, title: 'Balance', description: 'Standing and movement stability' },
      { id: 3, title: 'Fine Motor', description: 'Small muscle movements and control' }
    ]
  },
  {
    id: 'cognitive',
    title: 'Learning',
    icon: 'psychology',
    color: '#2196F3',
    description: 'Monitor learning and understanding',
    activities: [
      { id: 4, title: 'Problem Solving', description: 'Finding solutions to simple tasks' },
      { id: 5, title: 'Memory', description: 'Remembering people and objects' },
      { id: 6, title: 'Attention Span', description: 'Focus duration on activities' }
    ]
  },
  {
    id: 'behavior',
    title: 'Behavior',
    icon: 'emoji-emotions',
    color: '#FF9800',
    description: 'Track behavioral patterns and responses',
    activities: [
      { id: 7, title: 'Emotional Response', description: 'Reactions to different situations' },
      { id: 8, title: 'Social Interaction', description: 'Engagement with others' },
      { id: 9, title: 'Daily Routines', description: 'Adaptation to schedules' }
    ]
  }
];

const DevelopmentTab = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [animations] = useState(() => 
    categories.reduce((acc, category) => {
      acc[category.id] = new Animated.Value(0);
      return acc;
    }, {})
  );

  const toggleCategory = (categoryId) => {
    const isExpanding = expandedCategory !== categoryId;
    
    Animated.timing(animations[categoryId], {
      toValue: isExpanding ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setExpandedCategory(isExpanding ? categoryId : null);
  };

  const renderActivity = (activity) => (
    <TouchableOpacity 
      key={activity.id}
      style={styles.activityItem}
      onPress={() => {/* Navigate to detailed tracking */}}
    >
      <View style={styles.activityHeader}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {categories.map(category => (
        <View key={category.id} style={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryHeader, { borderLeftColor: category.color }]}
            onPress={() => toggleCategory(category.id)}
          >
            <View style={styles.categoryTitleContainer}>
              <MaterialIcons name={category.icon} size={24} color={category.color} />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <MaterialIcons
              name={expandedCategory === category.id ? 'expand-less' : 'expand-more'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
          
          <Animated.View style={[
            styles.activitiesContainer,
            {
              maxHeight: animations[category.id].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000]
              }),
              opacity: animations[category.id]
            }
          ]}>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            {category.activities.map(renderActivity)}
          </Animated.View>
        </View>
      ))}
    </ScrollView>
  );
};

// ... styles remain mostly the same, just rename milestone-related names to activity
const styles = StyleSheet.create({
  // ... previous styles remain
  activityItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default DevelopmentTab; 