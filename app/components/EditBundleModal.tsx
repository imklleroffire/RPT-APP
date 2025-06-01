import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Exercise } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/alerts';

interface EditBundleModalProps {
  visible: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (updatedExercises: Exercise[]) => void;
}

export default function EditBundleModal({
  visible,
  exercises,
  onClose,
  onSave,
}: EditBundleModalProps): JSX.Element {
  const { colors } = useTheme();
  const [updatedExercises, setUpdatedExercises] = useState<Exercise[]>(exercises);

  const handleUpdate = (id: string, field: keyof Exercise, value: string | number) => {
    setUpdatedExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === id 
          ? { 
              ...exercise, 
              [field]: typeof value === 'string' && ['reps', 'duration', 'restTime'].includes(field as string) 
                ? parseInt(value) || 0 
                : value 
            } 
          : exercise
      )
    );
  };

  const handleSave = () => {
    // Validate exercises
    const invalidExercises = updatedExercises.filter(
      (exercise) => !exercise.name || !exercise.instructions
    );

    if (invalidExercises.length > 0) {
      showAlert(
        'Error',
        'Please fill in all required fields (name and instructions) for all exercises.'
      );
      return;
    }

    onSave(updatedExercises);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Exercises</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.exerciseList}>
            {updatedExercises.map((exercise) => (
              <Card key={exercise.id} variant="glow" style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  {exercise.imageUrl && (
                    <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
                  )}
                  <View style={styles.exerciseInfo}>
                    <TextInput
                      style={[styles.exerciseNameInput, { color: colors.text.primary }]}
                      value={exercise.name}
                      onChangeText={(value) => handleUpdate(exercise.id, 'name', value)}
                      placeholder="Exercise name"
                      placeholderTextColor={colors.text.secondary}
                    />
                    <Text style={[styles.exerciseCategory, { color: colors.text.secondary }]}>
                      {exercise.category}
                    </Text>
                  </View>
                </View>

                <View style={styles.exerciseDetails}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                      Duration (seconds)
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary 
                      }]}
                      keyboardType="number-pad"
                      value={exercise.duration?.toString()}
                      onChangeText={(value) => handleUpdate(exercise.id, 'duration', value)}
                      placeholder="Duration"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                      Reps
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary 
                      }]}
                      keyboardType="number-pad"
                      value={exercise.reps?.toString()}
                      onChangeText={(value) => handleUpdate(exercise.id, 'reps', value)}
                      placeholder="Reps"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                      Rest Time (seconds)
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary 
                      }]}
                      keyboardType="number-pad"
                      value={exercise.restTime?.toString()}
                      onChangeText={(value) => handleUpdate(exercise.id, 'restTime', value)}
                      placeholder="Rest Time"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                </View>

                <View style={styles.exerciseInstructions}>
                  <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                    Instructions
                  </Text>
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary 
                    }]}
                    multiline
                    numberOfLines={4}
                    value={exercise.instructions}
                    onChangeText={(value) => handleUpdate(exercise.id, 'instructions', value)}
                    placeholder="Exercise instructions"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              size="medium"
              style={styles.footerButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="medium"
              style={styles.footerButton}
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
    maxHeight: '90%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameInput: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
    padding: SPACING.xs,
  },
  exerciseCategory: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  exerciseDetails: {
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  exerciseInstructions: {
    marginBottom: SPACING.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});