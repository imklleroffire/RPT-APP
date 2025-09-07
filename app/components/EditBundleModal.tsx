import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Exercise, Bundle } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/alerts';

// Predefined exercise images
const EXERCISE_IMAGES = [
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', // Upper body
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', // Balance
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', // Lower body
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Core
  'https://images.unsplash.com/photo-1616699002805-0741e1e4a9c5?w=800', // Posture
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', // Stretching
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800', // Yoga
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', // Pilates
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', // Rehabilitation
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Strength
];

interface EditBundleModalProps {
  visible: boolean;
  bundle: Bundle | null;
  onClose: () => void;
  onSave: (updatedBundle: { name: string; description: string; exercises: Exercise[]; coverImage: string }) => void;
}

export default function EditBundleModal({
  visible,
  bundle,
  onClose,
  onSave,
}: EditBundleModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [updatedExercises, setUpdatedExercises] = useState<Exercise[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);

  useEffect(() => {
    if (bundle && visible) {
      setBundleName(bundle.name || '');
      setBundleDescription(bundle.description || '');
      setUpdatedExercises(bundle.exercises || []);
      setCoverImage(bundle.coverImage || '');
    }
  }, [bundle, visible]);

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
    if (!bundleName.trim()) {
      showAlert('Error', 'Please enter a bundle name.');
      return;
    }

    onSave({
      name: bundleName,
      description: bundleDescription,
      exercises: updatedExercises,
      coverImage: coverImage
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Edit Bundle: {bundle?.name || 'Unknown'}
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={32} color="#e74c3c" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            
            {/* Bundle Information */}
            <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Bundle Information
              </Text>
              
                              <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>Name</Text>
                                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary 
                    }]}
                    value={bundleName}
                    onChangeText={setBundleName}
                    placeholder="Bundle name"
                    placeholderTextColor={colors.text.secondary}
                  />
              </View>

                              <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary 
                    }]}
                    value={bundleDescription}
                    onChangeText={setBundleDescription}
                    placeholder="Bundle description"
                    placeholderTextColor={colors.text.secondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Cover Image */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>Cover Image</Text>
                  {coverImage ? (
                    <Image source={{ uri: coverImage }} style={styles.coverImage} />
                  ) : (
                    <View style={[styles.coverImagePlaceholder, { backgroundColor: colors.background.primary }]}>
                      <Text style={{ color: colors.text.secondary }}>No cover image</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowImageSelector(!showImageSelector)}
                  >
                    <Text style={styles.changeImageButtonText}>
                      {showImageSelector ? 'Hide Image Options' : 'Change Cover Image'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showImageSelector && (
                    <View style={[styles.imageSelectorContainer, { backgroundColor: colors.background.primary }]}>
                      <Text style={[styles.imageSelectorTitle, { color: colors.text.primary }]}>
                        Choose a cover image:
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageScrollView}
                        contentContainerStyle={styles.imageScrollContent}
                      >
                        {EXERCISE_IMAGES.map((image, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setCoverImage(image);
                              setShowImageSelector(false);
                            }}
                            style={[
                              styles.imageOption,
                              coverImage === image && styles.selectedImage
                            ]}
                          >
                            <Image
                              source={{ uri: image }}
                              style={styles.thumbnailImage}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
            </View>

            {/* Exercises */}
            <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>

              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Exercises ({updatedExercises.length})
              </Text>

              {                updatedExercises.map((exercise, index) => (
                  <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseTitle, { color: colors.text.primary }]}>
                      Exercise {index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setUpdatedExercises(updatedExercises.filter(e => e.id !== exercise.id));
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Name</Text>
                                          <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.background.secondary,
                          color: colors.text.primary 
                        }]}
                        value={exercise.name}
                        onChangeText={(value) => handleUpdate(exercise.id, 'name', value)}
                        placeholder="Exercise name"
                        placeholderTextColor={colors.text.secondary}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Duration (seconds)</Text>
                                          <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.background.secondary,
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
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Reps</Text>
                                          <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.background.secondary,
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
                    <Text style={[styles.label, { color: colors.text.secondary }]}>Instructions</Text>
                                          <TextInput
                        style={[styles.textArea, { 
                          backgroundColor: colors.background.secondary,
                          color: colors.text.primary 
                        }]}
                        value={exercise.instructions}
                        onChangeText={(value) => handleUpdate(exercise.id, 'instructions', value)}
                        placeholder="Exercise instructions"
                        placeholderTextColor={colors.text.secondary}
                        multiline
                        numberOfLines={3}
                      />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  const newExercise: Exercise = {
                    id: Math.random().toString(),
                    name: '',
                    description: '',
                    imageUrl: '',
                    duration: 0,
                    difficulty: 'medium',
                    category: '',
                    restTime: 0,
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    assignedTo: [],
                    createdBy: '',
                  };
                  setUpdatedExercises([...updatedExercises, newExercise]);
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: colors.background.secondary }]}>
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
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 50, // Add safe area for header
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  exerciseCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginLeft: SPACING.xs,
  },
  coverImage: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  coverImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  changeImageButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  changeImageButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  imageSelectorContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  imageSelectorTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  imageScrollView: {
    marginBottom: SPACING.sm,
  },
  imageScrollContent: {
    paddingHorizontal: SPACING.xs,
  },
  imageOption: {
    width: 80,
    height: 80,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedImage: {
    borderColor: '#3498db',
    borderWidth: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#3498db',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});