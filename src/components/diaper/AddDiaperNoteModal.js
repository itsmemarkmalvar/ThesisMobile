import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '../../utils/shadowStyles';

const AddDiaperNoteModal = ({ visible, onClose, onSave, initialType = 'wet' }) => {
  const [notes, setNotes] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const handleSave = () => {
    onSave({
      type: selectedType,
      time: selectedTime,
      notes: notes.trim(),
    });
    resetForm();
  };

  const resetForm = () => {
    setNotes('');
    setSelectedType(initialType);
    setSelectedTime(new Date());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <MaterialIcons 
              name={selectedType === 'wet' ? 'opacity' : 'child-care'} 
              size={24} 
              color={selectedType === 'wet' ? '#4A90E2' : '#FF9800'} 
            />
            <Text style={styles.modalTitle}>
              Add {selectedType === 'wet' ? 'Wet' : 'Dirty'} Diaper Note
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Add notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...shadowStyles.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    ...shadowStyles.small,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default AddDiaperNoteModal; 