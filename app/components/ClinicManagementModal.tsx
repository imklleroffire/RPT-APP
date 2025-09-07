import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Therapist {
  id: string;
  name: string;
  email: string;
  patientCount: number;
  role: string;
}

interface Clinic {
  id: string;
  name: string;
  ownerId?: string;
  therapistId?: string;
  therapists?: string[];
  createdAt: any;
}

interface ClinicManagementModalProps {
  visible: boolean;
  clinic: Clinic | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ClinicManagementModal({
  visible,
  clinic,
  onClose,
  onUpdate,
}: ClinicManagementModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (clinic && visible) {
      setClinicName(clinic.name);
      fetchTherapists();
    }
  }, [clinic, visible]);

  const fetchTherapists = async () => {
    if (!clinic || !user) return;

    try {
      setLoading(true);
      const therapistsData: Therapist[] = [];
      
      // Get the current user (clinic owner) info
      const currentUserDoc = await getDoc(doc(db, 'users', user.id));
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        
        // Count patients for this therapist
        const bundlesQuery = query(collection(db, 'bundles'), where('createdBy', '==', user.id));
        const bundlesSnapshot = await getDocs(bundlesQuery);
        
        let patientCount = 0;
        bundlesSnapshot.docs.forEach(bundleDoc => {
          const bundleData = bundleDoc.data();
          patientCount += bundleData.assignedPatients?.length || 0;
        });
        
        therapistsData.push({
          id: user.id,
          name: userData.name || userData.email || 'Unknown',
          email: userData.email || '',
          patientCount,
          role: 'owner',
        });
      }

      // Get other therapists in the clinic
      if (clinic.therapists && clinic.therapists.length > 0) {
        for (const therapistId of clinic.therapists) {
          if (therapistId !== user.id) { // Skip the owner since we already added them
            try {
              const therapistDoc = await getDoc(doc(db, 'users', therapistId));
              if (therapistDoc.exists()) {
                const therapistData = therapistDoc.data();
                
                // Count patients for this therapist
                const bundlesQuery = query(collection(db, 'bundles'), where('createdBy', '==', therapistId));
                const bundlesSnapshot = await getDocs(bundlesQuery);
                
                let patientCount = 0;
                bundlesSnapshot.docs.forEach(bundleDoc => {
                  const bundleData = bundleDoc.data();
                  patientCount += bundleData.assignedPatients?.length || 0;
                });
                
                therapistsData.push({
                  id: therapistId,
                  name: therapistData.name || therapistData.email || 'Unknown',
                  email: therapistData.email || '',
                  patientCount,
                  role: 'therapist',
                });
              }
            } catch (error) {
              console.error(`Error fetching therapist ${therapistId}:`, error);
            }
          }
        }
      }
      
      setTherapists(therapistsData);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      showAlert('Error', 'Failed to load clinic data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClinicName = async () => {
    if (!clinic || !clinicName.trim()) {
      showAlert('Error', 'Please enter a clinic name');
      return;
    }

    try {
      const clinicRef = doc(db, 'clinics', clinic.id);
      await updateDoc(clinicRef, {
        name: clinicName.trim(),
        updatedAt: serverTimestamp(),
      });

      showAlert('Success', 'Clinic name updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating clinic name:', error);
      showAlert('Error', 'Failed to update clinic name');
    }
  };

  const handleInviteTherapist = async () => {
    if (!clinic || !inviteEmail.trim()) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      
      // Check if user exists
      const usersQuery = query(collection(db, 'users'), where('email', '==', inviteEmail.trim()));
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        showAlert('Error', 'No user found with this email address');
        return;
      }
      
      const targetUser = userSnapshot.docs[0];
      const userData = targetUser.data();
      
      if (userData.role !== 'therapist') {
        showAlert('Error', 'This user is not a therapist');
        return;
      }
      
      // Create invitation
      const invitation = {
        type: 'clinic_invitation',
        fromUserId: user?.id,
        fromUserName: user?.name || 'Unknown',
        toUserId: targetUser.id,
        toUserEmail: inviteEmail.trim(),
        clinicId: clinic.id,
        clinicName: clinic.name,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'notifications'), invitation);
      
      showAlert('Success', 'Invitation sent successfully');
      setInviteEmail('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      showAlert('Error', 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const isOwner = true; // Since this modal is only shown to clinic owners

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
        <View style={styles.modalContent}>
          <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Clinic Management
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#e74c3c" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
                         {/* Clinic Information */}
             <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Clinic Information
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Clinic Name
                </Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text.primary, 
                    backgroundColor: colors.background.primary 
                  }]}
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="Enter clinic name"
                  placeholderTextColor={colors.text.secondary}
                />
                <Button
                  title="Update Name"
                  onPress={handleUpdateClinicName}
                  variant="neon"
                  size="small"
                  style={styles.updateButton}
                />
              </View>
            </View>

            {/* Therapists */}
            <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Therapists ({therapists.length})
              </Text>
              
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : therapists.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No therapists in this clinic
                </Text>
              ) : (
                therapists.map((therapist) => (
                  <View key={therapist.id} style={styles.therapistItem}>
                    <View style={styles.therapistInfo}>
                      <View style={styles.therapistHeader}>
                        <Text style={[styles.therapistName, { color: colors.text.primary }]}>
                          {therapist.name}
                        </Text>
                        <View style={[
                          styles.roleBadge, 
                          { backgroundColor: therapist.role === 'owner' ? colors.success : colors.primary }
                        ]}>
                          <Text style={styles.roleText}>
                            {therapist.role === 'owner' ? 'Owner' : 'Therapist'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.therapistEmail, { color: colors.text.secondary }]}>
                        {therapist.email}
                      </Text>
                    </View>
                    <View style={styles.therapistStats}>
                      <Ionicons name="people-outline" size={16} color={colors.primary} />
                      <Text style={[styles.patientCount, { color: colors.text.secondary }]}>
                        {therapist.patientCount} patients
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Invite Therapists */}
            <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Invite Therapists
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Therapist Email
                </Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text.primary, 
                    backgroundColor: colors.background.primary 
                  }]}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter therapist email"
                  placeholderTextColor={colors.text.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  title={inviting ? "Sending..." : "Send Invitation"}
                  onPress={handleInviteTherapist}
                  variant="primary"
                  size="small"
                  style={styles.inviteButton}
                  disabled={inviting}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.background.secondary }]}>
            <Button
              title="Close"
              onPress={onClose}
              variant="outline"
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
    paddingTop: 50,
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
  inputLabel: {
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
    marginBottom: SPACING.sm,
  },
  updateButton: {
    marginTop: SPACING.xs,
  },
  inviteButton: {
    marginTop: SPACING.xs,
  },
  therapistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 152, 219, 0.2)',
    marginBottom: SPACING.sm,
  },
  therapistInfo: {
    flex: 1,
  },
  therapistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
    color: '#fff',
  },
  therapistName: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  therapistEmail: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
  },
  therapistStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientCount: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
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
    width: '100%',
  },
});
