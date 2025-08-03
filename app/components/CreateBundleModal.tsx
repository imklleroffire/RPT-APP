import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

interface Exercise {
  name: string;
  instructions: string;
  reps?: number;
  duration?: number;
}

interface CreateBundleModalProps {
  visible: boolean;
  onClose: () => void;
  onBundleCreated?: () => void;
}

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

export default function CreateBundleModal({ visible, onClose, onBundleCreated }: CreateBundleModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedImage, setSelectedImage] = useState(EXERCISE_IMAGES[0]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        instructions: '',
      },
    ]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number | undefined) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setExercises(updatedExercises);
  };

  const handleSave = async () => {
    if (!bundleName || !bundleDescription) {
      Alert.alert('Error', 'Please fill in bundle name and description');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    for (const exercise of exercises) {
      if (!exercise.name || !exercise.instructions) {
        Alert.alert('Error', 'Please fill in exercise name and instructions');
        return;
      }
    }

    setLoading(true);
    try {
      const bundleData = {
        name: bundleName,
        description: bundleDescription,
        coverImage: selectedImage,
        exercises: exercises.map((exercise, index) => ({
          ...exercise,
          id: `exercise-${index + 1}`,
        })),
        createdBy: user?.id,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      console.log('Saving bundle data:', bundleData);
      const docRef = await addDoc(collection(db, 'bundles'), bundleData);
      console.log('Bundle created with ID:', docRef.id);
      
      // Reset form
      setBundleName('');
      setBundleDescription('');
      setExercises([]);
      setSelectedImage(EXERCISE_IMAGES[0]);
      
      if (onBundleCreated) {
        onBundleCreated();
      }
      
      Alert.alert('Success', 'Bundle created successfully');
      onClose();
    } catch (error: any) {
      console.error('Error creating bundle:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to create bundle. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Bundle</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bundle Name *</Text>
              <TextInput
                style={styles.input}
                value={bundleName}
                onChangeText={setBundleName}
                placeholder="Enter bundle name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bundleDescription}
                onChangeText={setBundleDescription}
                placeholder="Enter bundle description"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cover Image</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
                contentContainerStyle={styles.imageScrollContent}
              >
                {EXERCISE_IMAGES.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImage(image)}
                    style={[
                      styles.imageOption,
                      selectedImage === image && styles.selectedImage
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImagePreview}
                />
              )}
            </View>

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={styles.label}>Exercises</Text>
                <TouchableOpacity style={styles.addButton} onPress={addExercise}>
                  <Ionicons name="add-circle" size={24} color="#4A90E2" />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <Text style={styles.exerciseTitle}>Exercise {index + 1}</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={exercise.name}
                      onChangeText={(value) => updateExercise(index, 'name', value)}
                      placeholder="Enter exercise name"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Instructions *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={exercise.instructions}
                      onChangeText={(value) => updateExercise(index, 'instructions', value)}
                      placeholder="Enter exercise instructions"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.exerciseParams}>
                    <View style={styles.paramInput}>
                      <Text style={styles.label}>Reps (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.reps?.toString() || ''}
                        onChangeText={(value) => {
                          const numValue = value === '' ? undefined : parseInt(value);
                          updateExercise(index, 'reps', numValue);
                        }}
                        placeholder="Number of reps"
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.paramInput}>
                      <Text style={styles.label}>Duration (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={exercise.duration?.toString() || ''}
                        onChangeText={(value) => {
                          const numValue = value === '' ? undefined : parseInt(value);
                          updateExercise(index, 'duration', numValue);
                        }}
                        placeholder="Duration in seconds"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Bundle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageScrollView: {
    marginBottom: 12,
  },
  imageScrollContent: {
    paddingHorizontal: 20,
  },
  imageOption: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedImage: {
    borderColor: '#4A90E2',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selectedImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  exercisesSection: {
    padding: 20,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    marginLeft: 4,
  },
  exerciseCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  exerciseParams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  paramInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 