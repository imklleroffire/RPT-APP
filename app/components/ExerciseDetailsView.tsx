import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface Exercise {
  name: string;
  reps?: number;
  duration?: number;
  description?: string;
  videoUrl?: string;
  instructions?: string;
}

interface ExerciseDetailsViewProps {
  visible: boolean;
  exercises: Exercise[]; // Accept an array of exercises
  onClose: () => void;
}

export const ExerciseDetailsView = ({ visible, exercises, onClose }: ExerciseDetailsViewProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Exercise Details</Text>
          {exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exercise.videoUrl && (
                <View style={styles.videoContainer}>
                  <Image 
                    source={{ uri: exercise.videoUrl }}
                    style={styles.videoThumbnail}
                    resizeMode="cover"
                  />
                </View>
              )}
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructions}>{exercise.instructions || 'No instructions available.'}</Text>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parameters</Text>
                <Text style={styles.parameter}>
                  {exercise.reps !== undefined 
                    ? `Repetitions: ${exercise.reps}`
                    : `Duration: ${exercise.duration} seconds`}
                </Text>
              </View>
            </View>
          ))}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </ScrollView>
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  parameter: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});