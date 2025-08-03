import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { showAlert } from '../utils/alerts';

interface Therapist {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  patients: string[];
}

interface ClinicDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

export default function ClinicDetailsModal({
  visible,
  onClose,
  clinicId,
  clinicName,
}: ClinicDetailsModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchTherapists();
  }, [clinicId]);

  const fetchTherapists = async () => {
    try {
      const therapistsRef = collection(db, 'therapists');
      const q = query(therapistsRef, where('clinicId', '==', clinicId));
      const snapshot = await getDocs(q);
      
      const therapistsList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const therapistData = doc.data();
          const patientsQuery = query(
            collection(db, 'patients'),
            where('therapistId', '==', doc.id)
          );
          const patientsSnapshot = await getDocs(patientsQuery);
          
          return {
            id: doc.id,
            name: therapistData.name,
            email: therapistData.email,
            specialization: therapistData.specialization,
            patients: patientsSnapshot.docs.map(patient => patient.id),
          } as Therapist;
        })
      );
      
      setTherapists(therapistsList);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      showAlert('Error', 'Failed to load therapists');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTherapist = async () => {
    if (!inviteEmail.trim()) {
      showAlert('Error', 'Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      // Create invitation in notifications collection
      await addDoc(collection(db, 'notifications'), {
        type: 'therapist_invite',
        fromUserId: user?.id,
        fromUserEmail: user?.email,
        fromUserName: user?.name,
        toEmail: inviteEmail.trim(),
        message: `You have been invited to join ${clinicName} as a therapist.`,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          clinicId,
          clinicName,
        },
      });

      showAlert('Success', 'Invitation sent successfully');
      setInviteEmail('');
      setIsInviting(false);
    } catch (error) {
      console.error('Error inviting therapist:', error);
      showAlert('Error', 'Failed to send invitation');
      setIsInviting(false);
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
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              {clinicName}
            </Text>
            <View style={styles.headerButtons}>
              <Button
                title="Manage Clinic"
                onPress={() => {
                  // Add clinic management functionality
                  showAlert('Info', 'Clinic management feature coming soon');
                }}
                variant="outline"
                size="small"
                style={styles.manageButton}
              />
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            <Card variant="glow" style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Invite Therapist
              </Text>
              <View style={styles.inviteForm}>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    borderColor: colors.primary,
                  }]}
                  placeholder="Enter therapist's email"
                  placeholderTextColor={colors.text.secondary}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  title={isInviting ? 'Sending...' : 'Send Invitation'}
                  onPress={handleInviteTherapist}
                  variant="primary"
                  size="medium"
                  disabled={isInviting}
                  style={styles.inviteButton}
                />
              </View>
            </Card>

            <Card variant="glow" style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Therapists ({therapists.length})
              </Text>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : therapists.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No therapists in the clinic yet
                </Text>
              ) : (
                therapists.map((therapist) => (
                  <View key={therapist.id} style={styles.therapistCard}>
                    <View style={styles.therapistInfo}>
                      <Text style={[styles.therapistName, { color: colors.text.primary }]}>
                        {therapist.name}
                      </Text>
                      <Text style={[styles.therapistEmail, { color: colors.text.secondary }]}>
                        {therapist.email}
                      </Text>
                      {therapist.specialization && (
                        <Text style={[styles.therapistSpecialization, { color: colors.text.secondary }]}>
                          {therapist.specialization}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.patientCount, { color: colors.text.primary }]}>
                      {therapist.patients.length} patients
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </ScrollView>
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
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButton: {
    marginRight: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  inviteForm: {
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  inviteButton: {
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  therapistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  therapistEmail: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  therapistSpecialization: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  patientCount: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
}); 