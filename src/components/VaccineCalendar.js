import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';

const VaccineCalendar = ({ vaccines, onDayPress }) => {
  // Process vaccines into calendar format
  const markedDates = {};
  vaccines.forEach(ageGroup => {
    ageGroup.vaccines.forEach(vaccine => {
      if (vaccine.date) {
        const dateString = vaccine.date.split('T')[0];
        markedDates[dateString] = {
          marked: true,
          dotColor: vaccine.completed ? '#4CAF50' : '#4A90E2',
          selected: true,
          selectedColor: 'rgba(74, 144, 226, 0.1)',
        };
      }
    });
  });

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          current={new Date().toISOString()}
          markedDates={markedDates}
          onDayPress={onDayPress}
          enableSwipeMonths={true}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            selectedDayBackgroundColor: '#4A90E2',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4A90E2',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#4CAF50',
            selectedDotColor: '#ffffff',
            arrowColor: '#4A90E2',
            monthTextColor: '#2d4150',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14
          }}
        />
      </View>
      <ScrollView style={styles.scheduleList}>
        {vaccines.map(ageGroup => (
          <View key={ageGroup.id} style={styles.scheduleItem}>
            <Text style={styles.ageGroupTitle}>{ageGroup.ageGroup}</Text>
            {ageGroup.vaccines
              .filter(v => !v.completed)
              .map(vaccine => (
                <View key={vaccine.id} style={styles.vaccineItem}>
                  <Text style={styles.scheduleName}>{vaccine.name}</Text>
                </View>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  calendarContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scheduleList: {
    flex: 1,
    padding: 16,
  },
  scheduleItem: {
    marginBottom: 16,
  },
  ageGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  vaccineItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleName: {
    fontSize: 14,
    color: '#666',
  },
});

export default VaccineCalendar; 