import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { showAlert } from '../utils/alerts';

interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string;
  duration: number;
  sets: number;
  reps: number;
}

interface ExerciseBundleModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (bundleId: string) => void;
  bundle: {
    id: string;
    name: string;
    description: string;
    exercises: Exercise[];
  };
}

export const ExerciseBundleModal = ({
  visible,
  onClose,
  onAssign,
  bundle,
}: ExerciseBundleModalProps) => {
  const handleAssign = async () => {
    try {
      await onAssign(bundle.id);
      showAlert('Success', 'Bundle assigned successfully');
      onClose();
    } catch (error) {
      showAlert('Error', 'Failed to assign bundle. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{bundle.name}</Text>
          <Text style={styles.modalDescription}>{bundle.description}</Text>
          <ScrollView style={styles.exercisesContainer}>
            {bundle.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                <Text style={styles.exerciseInstructions}>{exercise.instructions}</Text>
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseDetail}>Duration: {exercise.duration} min</Text>
                  <Text style={styles.exerciseDetail}>Sets: {exercise.sets}</Text>
                  <Text style={styles.exerciseDetail}>Reps: {exercise.reps}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.assignButton]}
              onPress={handleAssign}
            >
              <Text style={styles.buttonText}>Assign Bundle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  exercisesContainer: {
    maxHeight: '60%',
  },
  exerciseItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  exerciseInstructions: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  assignButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 