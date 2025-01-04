import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const VaccinationHistory = ({ visible, onClose, history }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Vaccination History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.historyList}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No vaccination records yet.</Text>
          ) : (
            history.map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.vaccineName}>{record.vaccine_name}</Text>
                  <Text style={styles.ageGroup}>{record.age_group}</Text>
                </View>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Given on: {new Date(record.given_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {record.administered_by && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        By: {record.administered_by}
                      </Text>
                    </View>
                  )}

                  {record.administered_at && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="location-on" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        At: {record.administered_at}
                      </Text>
                    </View>
                  )}

                  {record.notes && (
                    <View style={styles.notesContainer}>
                      <MaterialIcons name="notes" size={16} color="#666" />
                      <Text style={styles.notesText}>{record.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  historyList: {
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    marginBottom: 12,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ageGroup: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontStyle: 'italic',
  },
});

export default VaccinationHistory; 