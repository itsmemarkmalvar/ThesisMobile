import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { shadowStyles } from '../../utils/shadowStyles';

const DateFilter = ({ selectedDate, onDateChange }) => {
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrevDay} style={styles.arrowButton}>
        <MaterialIcons name="chevron-left" size={24} color="#666" />
      </TouchableOpacity>
      
      <Text style={styles.dateText}>
        {format(selectedDate, "MMMM d, yyyy")}
      </Text>
      
      <TouchableOpacity onPress={handleNextDay} style={styles.arrowButton}>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    ...shadowStyles.medium,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrowButton: {
    padding: 8,
  },
});

export default DateFilter; 