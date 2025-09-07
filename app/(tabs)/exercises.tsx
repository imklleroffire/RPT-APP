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
import { db } from '../config/firebase';
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
  userId?: string; // User ID if patient has joined the app
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
      const loadedBundles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('[EXERCISES] Loading bundle from Firestore:', doc.id, data);
        console.log('[EXERCISES] Bundle exercises from Firestore:', data.exercises);
        
        // Ensure all required fields are present and properly typed
        const bundle: Bundle = {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          coverImage: data.coverImage || '',
          exercises: Array.isArray(data.exercises) ? data.exercises : [],
          assignedPatients: Array.isArray(data.assignedPatients) ? data.assignedPatients : [],
          frequency: data.frequency || 'weekly',
          customDays: Array.isArray(data.customDays) ? data.customDays : [],
          createdBy: data.createdBy || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completed: data.completed || false,
        };
        return bundle;
      });
      
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
        // Get the actual user IDs for the selected patients
        const patientUserIds = [];
        for (const patient of selectedPatients) {
          // Search for the patient's user ID in the users collection
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', patient.email.toLowerCase())
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            patientUserIds.push(userDoc.id); // This is the actual user ID
            console.log('[EXERCISES] Found patient user ID:', userDoc.id, 'for patient:', patient.name);
          } else {
            console.log('[EXERCISES] No user found for patient:', patient.email);
          }
        }

        const newAssignedPatients = [...new Set([
          ...currentAssignedPatients,
          ...patientUserIds
        ])];

        await updateDoc(bundleRef, {
          assignedPatients: newAssignedPatients,
          updatedAt: serverTimestamp(),
        });

        // Create notifications for assigned patients
        await Promise.all(selectedPatients.map(async (patient) => {
          // Search for patient's userId in users collection by email
          console.log('[EXERCISES] Searching for patient userId by email:', patient.email);
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', patient.email.toLowerCase())
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          let patientUserId = null;
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            patientUserId = userDoc.id; // Document name is the userId
            console.log('[EXERCISES] Found patient userId:', patientUserId);
          } else {
            console.log('[EXERCISES] No user found with email:', patient.email);
          }

          const notificationRef = await addDoc(collection(db, 'notifications'), {
            type: 'bundle_assigned',
            fromUserId: user?.id,
            fromUserEmail: user?.email,
            fromUserName: user?.name,
            userId: patientUserId, // Use the found userId or null if not found
            toEmail: patient.email.toLowerCase(),
            message: `You have been assigned a new exercise bundle: ${selectedBundle.name}`,
            createdAt: serverTimestamp(),
        read: false,
        data: {
              bundleId: selectedBundle.id,
              bundleName: selectedBundle.name,
              patientId: patient.id,
              patientEmail: patient.email.toLowerCase(),
              therapistId: user?.id,
              therapistName: user?.name,
            },
          });

          console.log('[BUNDLE_ASSIGNMENT] Created notification:', {
            notificationId: notificationRef.id,
            type: 'bundle_assigned',
            toUserId: patientUserId || null,
            toEmail: patient.email,
            patientName: patient.name,
            bundleName: selectedBundle.name
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

  const handleEditBundle = async (updatedBundle: { name: string; description: string; exercises: Exercise[]; coverImage: string }) => {
    if (!selectedBundle) return;

    try {
      const bundleRef = doc(db, 'bundles', selectedBundle.id);
      await updateDoc(bundleRef, {
        name: updatedBundle.name,
        description: updatedBundle.description,
        exercises: updatedBundle.exercises,
        coverImage: updatedBundle.coverImage,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setBundles(bundles.map(bundle =>
        bundle.id === selectedBundle.id
          ? { 
              ...bundle, 
              name: updatedBundle.name,
              description: updatedBundle.description,
              exercises: updatedBundle.exercises,
              coverImage: updatedBundle.coverImage
            }
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

  const renderBundleCard = ({ item }: { item: Bundle }) => {
    // Ensure item has all required properties
    const safeItem = {
      ...item,
      exercises: Array.isArray(item?.exercises) ? item.exercises : [],
      name: item?.name || 'Unnamed Bundle',
      description: item?.description || '',
      coverImage: item?.coverImage || '',
    };

    return (
      <Card variant="neon" style={styles.bundleCard}>
        <Image source={{ uri: safeItem.coverImage }} style={styles.bundleImage} />
        <View style={styles.bundleContent}>
          <Text style={[styles.bundleName, { color: colors.text.primary }]}>
            {safeItem.name}
          </Text>
          <Text style={[styles.bundleDescription, { color: colors.text.secondary }]}>
            {safeItem.description}
          </Text>
          <Text style={[styles.exerciseCount, { color: colors.text.secondary }]}>
            {safeItem.exercises.length} exercises
          </Text>
        
                  <View style={styles.bundleActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => {
                console.log('[EXERCISES] Edit button pressed for bundle:', safeItem);
                console.log('[EXERCISES] Bundle exercises:', safeItem.exercises);
                console.log('[EXERCISES] Bundle exercises length:', safeItem.exercises?.length);
                setSelectedBundle(safeItem);
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => {
                setSelectedBundle(safeItem);
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
  };

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
        <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Exercise Bundles</Text>
        </View>
      </View>

      {/* Create Bundle section */}
      <View style={styles.createBundleSection}>
        <TouchableOpacity
          style={[styles.createBundleCard, { backgroundColor: colors.background.secondary }]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <View style={styles.createBundleContent}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
            <View style={styles.createBundleText}>
              <Text style={[styles.createBundleTitle, { color: colors.text.primary }]}>
                Create New Bundle
              </Text>
              <Text style={[styles.createBundleSubtitle, { color: colors.text.secondary }]}>
                Build custom exercise bundles for your patients
              </Text>
            </View>
          </View>
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
        bundle={selectedBundle}
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
    padding: SPACING.lg,
    paddingTop: 60, // Add safe area for iOS
  },
  headerContent: {
    flex: 1,
  },
  createBundleSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  createBundleCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createBundleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createBundleText: {
    flex: 1,
    marginLeft: 16,
  },
  createBundleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  createBundleSubtitle: {
    fontSize: 14,
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