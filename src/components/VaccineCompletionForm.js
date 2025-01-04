import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const VaccineCompletionForm = ({ visible, onClose, onSave, vaccine, details, setDetails }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Vaccination</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.vaccineTitle}>{vaccine?.name}</Text>
        <Text style={styles.ageGroup}>{vaccine?.ageGroup}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Administered by (doctor/nurse name)"
          value={details.administered_by}
          onChangeText={(text) => setDetails(prev => ({
            ...prev,
            administered_by: text
          }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Location (hospital/clinic)"
          value={details.administered_at}
          onChangeText={(text) => setDetails(prev => ({
            ...prev,
            administered_at: text
          }))}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Additional notes"
          value={details.notes}
          onChangeText={(text) => setDetails(prev => ({
            ...prev,
            notes: text
          }))}
          multiline
          numberOfLines={3}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => onSave(details)}
          >
            <Text style={styles.primaryButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  vaccineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ageGroup: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default VaccineCompletionForm; 