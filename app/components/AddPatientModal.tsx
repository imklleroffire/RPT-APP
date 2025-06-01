import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alerts';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (patientData: { name: string; email: string; phone: string }) => void;
}

export const AddPatientModal = ({ visible, onClose, onAdd }: AddPatientModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAdd = () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter a name');
      return;
    }
    if (!email.trim()) {
      showAlert('Error', 'Please enter an email');
      return;
    }
    if (!phone.trim()) {
      showAlert('Error', 'Please enter a phone number');
      return;
    }

    onAdd({ name, email, phone });
    setName('');
    setEmail('');
    setPhone('');
    setCondition('');
  };

  const handleSubmit = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create patient document
      const patientRef = await addDoc(collection(db, 'patients'), {
        name,
        email,
        phone,
        condition,
        therapistId: user?.id,
        isAppUser: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create invitation message
      await addDoc(collection(db, 'messages'), {
        type: 'invite',
        title: 'New Therapist Invitation',
        content: `${user?.name || 'A therapist'} has invited you to join their patient list.`,
        recipientId: email, // We'll use email as the recipientId for now
        senderId: user?.id,
        timestamp: Timestamp.now(),
        read: false,
        data: {
          patientId: patientRef.id,
          therapistId: user?.id,
          therapistName: user?.name,
        },
      });

      Alert.alert(
        'Success',
        'Patient added successfully. They will receive a notification when they join the app.',
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setCondition('');
    } catch (error) {
      console.error('Error adding patient:', error);
      Alert.alert('Error', 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add New Patient</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter patient's name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter patient's email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter patient's phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Condition (Optional)</Text>
            <TextInput
              style={styles.input}
              value={condition}
              onChangeText={setCondition}
              placeholder="Enter patient's condition"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Add Patient</Text>
              )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 