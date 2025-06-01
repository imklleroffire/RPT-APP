import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';

interface Exercise {
  name: string;
  reps?: number;
  duration?: number;
  description?: string;
  videoUrl?: string;
  instructions?: string;
}

interface ExerciseDetailModalProps {
  visible: boolean;
  exercise: Exercise;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}

export const ExerciseDetailModal = ({ visible, exercise, onClose, onSave }: ExerciseDetailModalProps) => {
  const [value, setValue] = useState(exercise.reps?.toString() || exercise.duration?.toString() || '');
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{exercise.name}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {exercise.reps !== undefined ? 'Repetitions' : 'Duration (seconds)'}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={value}
              onChangeText={setValue}
              maxLength={exercise.reps !== undefined ? 2 : 3}
              placeholder={exercise.reps !== undefined ? '1-30 reps' : '5-120 seconds'}
            />
          </View>

          <Text style={styles.description}>{exercise.description}</Text>

          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, { backgroundColor: '#666' }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
            <Pressable 
              style={styles.button}
              onPress={() => {
                const updatedExercise = {
                  ...exercise,
                  [exercise.reps !== undefined ? 'reps' : 'duration']: parseInt(value)
                };
                onSave(updatedExercise);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 