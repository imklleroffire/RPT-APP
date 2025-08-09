import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { doc, collection, addDoc, serverTimestamp, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { showAlert } from '../utils/alerts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  condition?: string;
  isAppUser: boolean;
  therapistId: string;
  createdAt: Date;
  status: string;
}

// Test function to verify button clicks
const testDelete = () => {
  console.log('Delete button clicked');
  showAlert('Test', 'Delete button works!');
};

export default function PatientsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    condition: ''
  });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Log initial render
  useEffect(() => {
    console.log('PatientsScreen mounted');
    console.log('Current user:', user);
  }, []);

  // Fetch patients
  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID found');
      return;
    }

    console.log('Fetching patients for user:', user.id);
    
    const q = query(
      collection(db, 'patients'),
      where('therapistId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const patientList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          isAppUser: doc.data().isAppUser || doc.data().status === 'accepted',
          status: doc.data().status || (doc.data().isAppUser ? 'accepted' : 'pending')
        })) as Patient[];
        console.log('Patients loaded:', patientList.length);
        setPatients(patientList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching patients:', error);
        showAlert('Error', 'Failed to load patients');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const addNewPatient = async () => {
    if (!user) return;

    if (!newPatient.name || !newPatient.email || !newPatient.phone) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const patientData = {
        ...newPatient,
        therapistId: user.id,
        isAppUser: false,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'patients'), patientData);
      setIsAddModalVisible(false);
      setNewPatient({
        name: '',
        email: '',
        phone: '',
        condition: ''
      });
      showAlert('Success', 'Patient added successfully!');
    } catch (error) {
      console.error('Error adding patient:', error);
      showAlert('Error', 'Could not add patient. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;
    
    try {
      const patientRef = doc(db, 'patients', selectedPatient.id);
      await deleteDoc(patientRef);
      console.log('Patient deleted successfully');
      setDeleteModalVisible(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Delete error:', error);
      showAlert('Error', 'Failed to delete patient');
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <Card variant="glow" style={styles.patientCard}>
      <TouchableOpacity 
        style={styles.mainCardContent}
        onPress={() => router.push(`/patient-detail/${item.id}`)}
      >
        <View style={styles.patientInfo}>
          <View style={styles.nameContainer}>
            <Ionicons 
              name={item.isAppUser ? "person-circle" : "person-circle-outline"} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={[styles.patientName, { color: colors.text.primary }]}>
              {item.name}
            </Text>
          </View>
          <Text style={[styles.patientEmail, { color: colors.text.secondary }]}>
            {item.email}
          </Text>
          <Text style={[styles.patientPhone, { color: colors.text.secondary }]}>
            {item.phone}
          </Text>
          {item.condition && (
            <Text style={[styles.patientCondition, { color: colors.text.secondary }]}>
              {item.condition}
            </Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'accepted' || item.isAppUser ? colors.success : colors.warning }
          ]}>
            <Text style={[styles.statusText, { color: colors.text.primary }]}>
              {item.status === 'accepted' || item.isAppUser ? 'Active' : 'Pending'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => {
              setSelectedPatient(item);
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Patients
        </Text>
        <Button
          title="Add Patient"
          onPress={() => setIsAddModalVisible(true)}
          variant="primary"
          size="medium"
          icon="add"
        />
      </View>

      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No patients added yet
          </Text>
          <Button
            title="Add Your First Patient"
            onPress={() => setIsAddModalVisible(true)}
            variant="outline"
            size="large"
            icon="add"
          />
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Add New Patient
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Patient Name"
                  placeholderTextColor={colors.text.secondary}
                  value={newPatient.name}
                  onChangeText={(text) => setNewPatient({...newPatient, name: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Email *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor={colors.text.secondary}
                  value={newPatient.email}
                  onChangeText={(text) => setNewPatient({...newPatient, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Phone *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.text.secondary}
                  value={newPatient.phone}
                  onChangeText={(text) => setNewPatient({...newPatient, phone: text})}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Condition/Notes (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { 
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Add any relevant medical conditions or notes"
                  placeholderTextColor={colors.text.secondary}
                  value={newPatient.condition}
                  onChangeText={(text) => setNewPatient({...newPatient, condition: text})}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setIsAddModalVisible(false)}
                variant="outline"
                size="medium"
                style={styles.footerButton}
              />
              <Button
                title="Add Patient"
                onPress={addNewPatient}
                variant="primary"
                size="medium"
                style={styles.footerButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.confirmModalContent, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Delete Patient
            </Text>
            <Text style={[styles.confirmText, { color: colors.text.secondary }]}>
              Are you sure you want to delete {selectedPatient?.name}?
              This action cannot be undone.
            </Text>
            
            <View style={styles.confirmButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedPatient(null);
                }}
                variant="outline"
                size="medium"
                style={styles.footerButton}
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="danger"
                size="medium"
                style={styles.footerButton}
              />
            </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    marginVertical: SPACING.lg,
    textAlign: 'center',
  },
  listContainer: {
    padding: SPACING.md,
  },
  patientCard: {
    marginBottom: SPACING.md,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  patientInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  patientName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginLeft: SPACING.sm,
  },
  patientEmail: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  patientPhone: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  patientCondition: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  deleteButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  modalScroll: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  confirmModalContent: {
    width: '90%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  confirmText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginVertical: SPACING.lg,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
}); 