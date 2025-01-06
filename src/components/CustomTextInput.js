import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const CustomTextInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  error,
  placeholder,
  rightIcon,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor="#999"
          autoCapitalize="none"
          {...props}
        />
        {rightIcon}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  inputContainerError: {
    borderColor: '#FF4B4B',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomTextInput; 