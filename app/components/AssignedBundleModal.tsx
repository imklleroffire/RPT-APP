import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable, Alert, TouchableOpacity } from 'react-native';
import { db } from '../../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { isSameDay, addDays } from 'date-fns';
import { showAlert } from '../utils/alerts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Exercise {
  name: string;
  reps?: number;
  duration?: number;
  description?: string;
  instructions?: string;
}

interface AssignedBundleModalProps {
  visible: boolean;
  exercises: Exercise[];
  bundleId: string;
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function AssignedBundleModal({
  visible,
  exercises,
  bundleId,
  userId,
  onClose,
  onComplete,
}: AssignedBundleModalProps) {
  const { colors } = useTheme();
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [activeTimers, setActiveTimers] = useState<{ [key: number]: boolean }>({});
  const [inProgressReps, setInProgressReps] = useState<number[]>([]);
  const [bundleCompletedToday, setBundleCompletedToday] = useState(false);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      try {
        const today = new Date();
        const bundleRef = doc(db, 'completedExercises', `${userId}_${bundleId}`);
        const bundleDoc = await getDoc(bundleRef);

        if (bundleDoc.exists()) {
          const data = bundleDoc.data();
          const lastCompletedDate = data.lastCompletedDate?.toDate();

          if (isSameDay(today, lastCompletedDate)) {
            setCompletedExercises(data.completedExercises || []);
            setBundleCompletedToday(true);
          } else {
            setCompletedExercises([]);
            setBundleCompletedToday(false);
            await setDoc(bundleRef, {
              completedExercises: [],
              lastCompletedDate: null,
            });
          }
        } else {
          setCompletedExercises([]);
          setBundleCompletedToday(false);
        }
      } catch (error) {
        console.error('Error fetching completion status:', error);
      }
    };

    if (visible) {
      fetchCompletionStatus();
    }
  }, [visible, bundleId, userId]);

  const saveCompletionStatus = async (updatedCompletedExercises: number[]) => {
    try {
      const today = new Date();
      const docName = `${userId}_${bundleId}`;
      const bundleRef = doc(db, 'completedExercises', docName);
      await setDoc(bundleRef, {
        completedExercises: updatedCompletedExercises,
        lastCompletedDate: today,
      });
    } catch (error) {
      console.error('Error saving completion status:', error);
    }
  };

  const handleCompleteExercise = (index: number) => {
    if (!completedExercises.includes(index)) {
      const updatedCompletedExercises = [...completedExercises, index];
      setCompletedExercises(updatedCompletedExercises);
      saveCompletionStatus(updatedCompletedExercises);
    }
  };

  const handleStartTimer = (index: number, duration: number) => {
    setActiveTimers((prev) => ({ ...prev, [index]: true }));

    setTimeout(() => {
      setActiveTimers((prev) => ({ ...prev, [index]: false }));
      handleCompleteExercise(index);
    }, duration * 1000);
  };

  const handleStartReps = (index: number) => {
    if (!inProgressReps.includes(index)) {
      setInProgressReps([...inProgressReps, index]);
    } else {
      handleCompleteExercise(index);
      setInProgressReps(inProgressReps.filter((i) => i !== index));
    }
  };

  const isBundleComplete = completedExercises.length === exercises.length;

  const handleCompleteBundle = async () => {
    if (!isBundleComplete) {
      showAlert('Incomplete Bundle', 'Please complete all exercises before marking the bundle as complete.');
      return;
    }

    try {
      await onComplete();
      showAlert('Success', 'Bundle completed successfully!');
      onClose();
    } catch (error) {
      showAlert('Error', 'Failed to complete the bundle. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Exercises</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.exercisesList}>
            {exercises.map((exercise, index) => (
              <Card key={index} variant="glow" style={styles.exerciseCard}>
                <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                  {exercise.name}
                </Text>
                {exercise.description && (
                  <Text style={[styles.exerciseDescription, { color: colors.text.secondary }]}>
                    {exercise.description}
                  </Text>
                )}
                <View style={styles.exerciseDetails}>
                  {exercise.reps && (
                    <View style={styles.detailItem}>
                      <Ionicons name="repeat" size={16} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                        {exercise.reps} reps
                      </Text>
                    </View>
                  )}
                  {exercise.duration && (
                    <View style={styles.detailItem}>
                      <Ionicons name="time" size={16} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                        {exercise.duration} seconds
                      </Text>
                    </View>
                  )}
                </View>
                {exercise.instructions && (
                  <Text style={[styles.instructions, { color: colors.text.secondary }]}>
                    {exercise.instructions}
                  </Text>
                )}
                <Button
                  title={
                    completedExercises.includes(index)
                      ? 'Completed'
                      : activeTimers[index]
                      ? 'In Progress...'
                      : inProgressReps.includes(index)
                      ? 'Click to Finish'
                      : exercise.duration
                      ? 'Start Timer'
                      : 'Start Exercise'
                  }
                  onPress={() => {
                    if (completedExercises.includes(index)) return;
                    if (exercise.duration) {
                      if (!activeTimers[index]) {
                        handleStartTimer(index, exercise.duration);
                      }
                    } else if (exercise.reps) {
                      handleStartReps(index);
                    }
                  }}
                  variant={completedExercises.includes(index) ? 'outline' : 'neon'}
                  style={styles.exerciseButton}
                  disabled={completedExercises.includes(index)}
                />
              </Card>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Complete Bundle"
              onPress={handleCompleteBundle}
              variant="neon"
              style={styles.completeButton}
              icon="checkmark-circle"
              disabled={!isBundleComplete}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  exercisesList: {
    paddingHorizontal: SPACING.lg,
  },
  exerciseCard: {
    marginBottom: SPACING.md,
  },
  exerciseName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  exerciseDescription: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  instructions: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  exerciseButton: {
    marginTop: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  completeButton: {
    width: '100%',
  },
});