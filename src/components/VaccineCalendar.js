import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, CalendarList } from 'react-native-calendars';

const VaccineCalendar = ({ vaccines, onDayPress }) => {
  // Process vaccines into calendar format
  const markedDates = {};
  vaccines.forEach(ageGroup => {
    ageGroup.vaccines.forEach(vaccine => {
      if (vaccine.date) {
        markedDates[vaccine.date.split('T')[0]] = {
          marked: true,
          dotColor: '#4CAF50'
        };
      }
    });
  });

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          selectedDayBackgroundColor: '#4A90E2',
          todayTextColor: '#4A90E2',
          dotColor: '#4CAF50',
          arrowColor: '#4A90E2',
        }}
      />
      <ScrollView style={styles.scheduleList}>
        {/* Render upcoming vaccines */}
        {vaccines.map(ageGroup => (
          ageGroup.vaccines
            .filter(v => !v.completed)
            .map(vaccine => (
              <View key={vaccine.id} style={styles.scheduleItem}>
                <Text style={styles.scheduleName}>{vaccine.name}</Text>
                <Text style={styles.scheduleAge}>Due: {ageGroup.ageGroup}</Text>
              </View>
            ))
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scheduleList: {
    flex: 1,
    padding: 16,
  },
  scheduleItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default VaccineCalendar; 