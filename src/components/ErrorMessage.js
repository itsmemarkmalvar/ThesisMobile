import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ErrorMessage = ({ message }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon name="alert-circle" size={24} color={theme.colors.error} />
      <Text style={[styles.message, { color: theme.colors.error }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  message: {
    marginLeft: 8,
    flex: 1,
  },
});

export default ErrorMessage; 