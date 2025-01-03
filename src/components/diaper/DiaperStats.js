import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { shadowStyles } from '../../utils/shadowStyles';

const DiaperStats = ({ diaperLogs, selectedDate }) => {
  // Calculate statistics for the selected date
  const getDayStats = () => {
    const dayLogs = diaperLogs.filter(log => {
      const logDate = new Date(log.time);
      return (
        logDate.getDate() === selectedDate.getDate() &&
        logDate.getMonth() === selectedDate.getMonth() &&
        logDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    return {
      total: dayLogs.length,
      wet: dayLogs.filter(log => log.type === 'wet').length,
      dirty: dayLogs.filter(log => log.type === 'dirty').length,
    };
  };

  // Prepare weekly data for the chart
  const getWeeklyData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const data = days.map(date => {
      const dayLogs = diaperLogs.filter(log => {
        const logDate = new Date(log.time);
        return (
          logDate.getDate() === date.getDate() &&
          logDate.getMonth() === date.getMonth() &&
          logDate.getFullYear() === date.getFullYear()
        );
      });
      return dayLogs.length || 0;
    });

    return {
      labels: days.map(date => format(date, 'EEE')),
      data: data.length ? data : [0, 0, 0, 0, 0, 0, 0],
    };
  };

  const stats = getDayStats();
  const weeklyData = getWeeklyData();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      
      {/* Daily Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.wet}</Text>
          <Text style={styles.statLabel}>Wet</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.dirty}</Text>
          <Text style={styles.statLabel}>Dirty</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Overview</Text>
        <LineChart
          data={{
            labels: weeklyData.labels,
            datasets: [{
              data: weeklyData.data
            }]
          }}
          width={Dimensions.get('window').width - 64}
          height={160}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#4A90E2'
            },
            propsForLabels: {
              fontSize: 10
            }
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
            paddingRight: 16
          }}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withShadow={false}
          bezier
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadowStyles.small,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
});

export default DiaperStats; 