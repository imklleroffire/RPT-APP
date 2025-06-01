import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { db } from './config/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AssignedExercise } from './patient-detail';

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams();
  const [exercise, setExercise] = useState<AssignedExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      const exerciseRef = doc(db, 'exercises', exerciseId as string);
      const exerciseDoc = await getDoc(exerciseRef);
      
      if (!exerciseDoc.exists()) {
        Alert.alert('Error', 'Exercise not found');
        return;
      }

      const exerciseData = {
        id: exerciseDoc.id,
        ...exerciseDoc.data()
      } as AssignedExercise;

      setExercise(exerciseData);
      setNotes(exerciseData.notes || '');
    } catch (error) {
      console.error('Error fetching exercise details:', error);
      Alert.alert('Error', 'Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: AssignedExercise['status']) => {
    if (!exercise) return;

    try {
      const exerciseRef = doc(db, 'exercises', exercise.id);
      await updateDoc(exerciseRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      setExercise({
        ...exercise,
        status: newStatus,
      });
    } catch (error) {
      console.error('Error updating exercise status:', error);
      Alert.alert('Error', 'Failed to update exercise status');
    }
  };

  const handleNotesUpdate = async () => {
    if (!exercise) return;

    try {
      const exerciseRef = doc(db, 'exercises', exercise.id);
      await updateDoc(exerciseRef, {
        notes,
        updatedAt: new Date(),
      });

      setExercise({
        ...exercise,
        notes,
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating exercise notes:', error);
      Alert.alert('Error', 'Failed to update exercise notes');
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;

    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const exerciseRef = doc(db, 'exercises', exercise.id);
              await deleteDoc(exerciseRef);
              router.back();
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: 
            exercise.status === 'completed' ? '#4CAF50' :
            exercise.status === 'skipped' ? '#FF5252' : '#FFA726'
          }
        ]}>
          <Text style={styles.statusText}>
            {exercise.status.charAt(0).toUpperCase() + exercise.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>{exercise.description}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sets:</Text>
          <Text style={styles.detailValue}>{exercise.defaultSets}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reps:</Text>
          <Text style={styles.detailValue}>{exercise.defaultReps}</Text>
        </View>
        {exercise.defaultHoldTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hold Time:</Text>
            <Text style={styles.detailValue}>{exercise.defaultHoldTime}s</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {editing ? (
          <View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Add notes about the exercise..."
            />
            <View style={styles.notesActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setNotes(exercise.notes || '');
                  setEditing(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleNotesUpdate}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.notesText}>
              {exercise.notes || 'No notes added yet.'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Notes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.completeButton,
              exercise.status === 'completed' && styles.disabledButton
            ]}
            onPress={() => handleStatusUpdate('completed')}
            disabled={exercise.status === 'completed'}
          >
            <Text style={styles.actionButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.skipButton,
              exercise.status === 'skipped' && styles.disabledButton
            ]}
            onPress={() => handleStatusUpdate('skipped')}
            disabled={exercise.status === 'skipped'}
          >
            <Text style={styles.actionButtonText}>Mark as Skipped</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.resetButton,
              exercise.status === 'pending' && styles.disabledButton
            ]}
            onPress={() => handleStatusUpdate('pending')}
            disabled={exercise.status === 'pending'}
          >
            <Text style={styles.actionButtonText}>Reset Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.deleteButtonText}>Delete Exercise</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  editButton: {
    marginTop: 10,
  },
  editButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    backgroundColor: '#FF5252',
  },
  resetButton: {
    backgroundColor: '#FFA726',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  deleteButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 