import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ExerciseDetailsView } from '../components/ExerciseDetailsView';
import CreateBundleModal from '../components/CreateBundleModal';
import EditBundleModal from '../components/EditBundleModal';
import { useRouter } from 'expo-router';
import { showAlert } from '../utils/alerts';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { EXERCISE_IMAGES, DEFAULT_BUNDLES } from '../constants/exerciseImages';
import { Exercise, Bundle } from '../types';

interface Patient {
  id: string;
  name: string;
  email: string;
  selected?: boolean;
}

export default function ExercisesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const fetchBundles = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'bundles'),
        where('createdBy', '==', user.id)
      );

      const querySnapshot = await getDocs(q);
      const loadedBundles = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Bundle[];
      
      if (loadedBundles.length === 0) {
        const defaultBundles = await createDefaultBundles();
        setBundles(defaultBundles);
      } else {
        setBundles(loadedBundles);
      }
    } catch (error) {
      console.error('Error loading bundles:', error);
      showAlert('Error', 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, [user?.id]);

  const createDefaultBundles = async () => {
    const createdBundles: Bundle[] = [];
    
    try {
      for (const defaultBundle of DEFAULT_BUNDLES) {
        // First create exercises for the bundle
        const exercises = await Promise.all((defaultBundle.exercises || []).map(async (exercise) => {
          const exerciseData = {
            name: exercise.name || '',
            description: exercise.description || '',
            instructions: exercise.instructions || '',
            imageUrl: exercise.imageUrl || '',
            duration: exercise.duration || 0,
            reps: exercise.reps || 0,
            difficulty: exercise.difficulty || 'easy',
            category: exercise.category || '',
            assignedTo: [],
            createdBy: user!.id,
            restTime: exercise.restTime || 0,
            status: 'pending' as const
          };

          const exerciseDoc = await addDoc(collection(db, 'exercises'), {
            ...exerciseData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          const newExercise: Exercise = {
            ...exerciseData,
            id: exerciseDoc.id,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Exercise;

          return newExercise;
        }));

        const now = new Date();
        const bundleData: Omit<Bundle, 'id'> = {
          name: defaultBundle.name || '',
          description: defaultBundle.description || '',
          coverImage: defaultBundle.coverImage || EXERCISE_IMAGES[0],
          exercises,
          createdBy: user!.id,
          createdAt: now,
          updatedAt: now,
          assignedPatients: [],
          frequency: 'weekly',
          customDays: [],
          completed: false
        };

        const docRef = await addDoc(collection(db, 'bundles'), {
          ...bundleData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        createdBundles.push({
          ...bundleData,
          id: docRef.id,
        });
      }

      return createdBundles;
    } catch (error) {
      console.error('Error creating default bundles:', error);
      showAlert('Error', 'Failed to create default bundles');
      return [];
    }
  };

  const fetchPatients = async () => {
    if (!user) return;

    setPatientsLoading(true);
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('therapistId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      setPatients(querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          selected: false,
      })) as Patient[]);
      } catch (error) {
        console.error('Error fetching patients:', error);
      showAlert('Error', 'Failed to load patients');
      } finally {
      setPatientsLoading(false);
      }
    };

  const handleAssignBundle = async () => {
    if (!selectedBundle) return;

    const selectedPatients = patients.filter(p => p.selected);
    if (selectedPatients.length === 0) {
      showAlert('Error', 'Please select at least one patient');
      return;
    }

    try {
      const bundleRef = doc(db, 'bundles', selectedBundle.id);
      const bundleDoc = await getDoc(bundleRef);
      
      if (bundleDoc.exists()) {
        const currentAssignedPatients = bundleDoc.data().assignedPatients || [];
        const newAssignedPatients = [...new Set([
          ...currentAssignedPatients,
          ...selectedPatients.map(p => p.id)
        ])];

        await updateDoc(bundleRef, {
          assignedPatients: newAssignedPatients,
          updatedAt: serverTimestamp(),
        });

        // Create notifications for assigned patients
        await Promise.all(selectedPatients.map(async (patient) => {
          await addDoc(collection(db, 'notifications'), {
            type: 'bundle_assigned',
            fromUserId: user?.id,
            fromUserEmail: user?.email,
            fromUserName: user?.name,
            toUserId: patient.id,
            message: `You have been assigned a new exercise bundle: ${selectedBundle.name}`,
            createdAt: serverTimestamp(),
        read: false,
        data: {
              bundleId: selectedBundle.id,
              bundleName: selectedBundle.name,
              therapistId: user?.id,
              therapistName: user?.name,
            },
          });
        }));

        showAlert('Success', 'Bundle assigned successfully');
        setIsAssignModalVisible(false);
        setSelectedBundle(null);
        setPatients(patients.map(p => ({ ...p, selected: false })));
      }
    } catch (error) {
      console.error('Error assigning bundle:', error);
      showAlert('Error', 'Failed to assign bundle');
    }
  };

  const handleEditBundle = async (updatedExercises: Exercise[]) => {
    if (!selectedBundle) return;

    try {
      const bundleRef = doc(db, 'bundles', selectedBundle.id);
      await updateDoc(bundleRef, {
        exercises: updatedExercises,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setBundles(bundles.map(bundle =>
        bundle.id === selectedBundle.id
          ? { ...bundle, exercises: updatedExercises }
          : bundle
      ));

      showAlert('Success', 'Bundle updated successfully');
      setIsEditModalVisible(false);
      setSelectedBundle(null);
    } catch (error) {
      console.error('Error updating bundle:', error);
      showAlert('Error', 'Failed to update bundle');
    }
  };

  const renderBundleCard = ({ item }: { item: Bundle }) => (
    <Card variant="neon" style={styles.bundleCard}>
      <Image source={{ uri: item.coverImage }} style={styles.bundleImage} />
      <View style={styles.bundleContent}>
        <Text style={[styles.bundleName, { color: colors.text.primary }]}>
          {item.name}
        </Text>
        <Text style={[styles.bundleDescription, { color: colors.text.secondary }]}>
          {item.description}
        </Text>
        <Text style={[styles.exerciseCount, { color: colors.text.secondary }]}>
          {item.exercises.length} exercises
        </Text>
        
        <View style={styles.bundleActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => {
              setSelectedBundle(item);
              setIsEditModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text.primary }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => {
              setSelectedBundle(item);
              fetchPatients();
              setIsAssignModalVisible(true);
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text.primary }]}>Assign</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Exercise Bundles</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.text.primary} />
          <Text style={[styles.addButtonText, { color: colors.text.primary }]}>Create Bundle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bundles}
        renderItem={renderBundleCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.bundleList}
      />

      <CreateBundleModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onBundleCreated={fetchBundles}
      />

      <EditBundleModal
        visible={isEditModalVisible}
        exercises={selectedBundle?.exercises || []}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleEditBundle}
      />

      <Modal
        visible={isAssignModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Assign Bundle</Text>
              <TouchableOpacity onPress={() => setIsAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {patientsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : patients.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No patients available to assign.
              </Text>
            ) : (
              <>
                <ScrollView style={styles.patientList}>
                  {patients.map((patient) => (
                    <Card key={patient.id} variant="glow" style={styles.patientCard}>
                      <View style={styles.patientInfo}>
                        <Text style={[styles.patientName, { color: colors.text.primary }]}>
                          {patient.name}
                        </Text>
                        <Text style={[styles.patientEmail, { color: colors.text.secondary }]}>
                          {patient.email}
                        </Text>
                      </View>
                    <Switch
                      value={patient.selected}
                      onValueChange={(value) => {
                          setPatients(patients.map(p =>
                            p.id === patient.id ? { ...p, selected: value } : p
                          ));
                      }}
                        trackColor={{ false: colors.background.primary, true: colors.primary }}
                        thumbColor={colors.text.primary}
                    />
                    </Card>
                ))}
              </ScrollView>

                <TouchableOpacity
                  style={[styles.assignButton, { backgroundColor: colors.primary }]}
                  onPress={handleAssignBundle}
              >
                  <Text style={[styles.assignButtonText, { color: colors.text.primary }]}>
                    Assign to Selected Patients
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  bundleList: {
    padding: SPACING.md,
  },
  bundleCard: {
    marginBottom: SPACING.md,
  },
  bundleImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  bundleContent: {
    padding: SPACING.md,
  },
  bundleName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  bundleDescription: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  exerciseCount: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
  },
  bundleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  patientList: {
    maxHeight: 400,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  patientEmail: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
  },
  assignButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  assignButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
});