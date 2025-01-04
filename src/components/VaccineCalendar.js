import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

const VaccineCalendar = ({ markedDates, onDayPress }) => {
  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        enableSwipeMonths={true}
        hideExtraDays={true}
        firstDay={1}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#333',
          selectedDayBackgroundColor: '#4A90E2',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4A90E2',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#4CAF50',
          selectedDotColor: '#ffffff',
          arrowColor: '#4A90E2',
          monthTextColor: '#333',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
          'stylesheet.calendar.header': {
            header: {
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingLeft: 10,
              paddingRight: 10,
              marginTop: 6,
              alignItems: 'center',
            },
          },
          'stylesheet.day.basic': {
            base: {
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
            },
            selected: {
              backgroundColor: '#4A90E2',
              borderRadius: 16,
            },
            dot: {
              width: 4,
              height: 4,
              marginTop: 1,
              borderRadius: 2,
            },
            dotContainer: {
              flexDirection: 'row',
              justifyContent: 'center',
            },
          },
        }}
        markingType="multi-dot"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  }
});

export default VaccineCalendar; 