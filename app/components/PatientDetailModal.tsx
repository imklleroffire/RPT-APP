import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { showAlert } from '../utils/alerts';
import { useTheme } from '../context/ThemeContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  condition: string;
  assignedBundles: string[];
  lastActive: Date;
}

interface PatientDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: (patientId: string) => void;
  patient: Patient;
}

export const PatientDetailModal = ({
  visible,
  onClose,
  onDelete,
  patient,
}: PatientDetailModalProps) => {
  const { colors } = useTheme();

  const handleDelete = async () => {
    try {
      await onDelete(patient.id);
      showAlert('Success', 'Patient deleted successfully');
      onClose();
    } catch (error) {
      showAlert('Error', 'Failed to delete patient. Please try again.');
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
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Patient Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContainer}>
            <Card variant="glow" style={styles.detailCard}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Personal Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Name</Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.name}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.email}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.phone}
                  </Text>
                </View>
              </View>
            </Card>

            <Card variant="glow" style={styles.detailCard}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Medical Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Condition</Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.condition || 'Not specified'}
                  </Text>
                </View>
              </View>
            </Card>

            <Card variant="glow" style={styles.detailCard}>
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Exercise Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    Assigned Bundles
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.assignedBundles.length > 0
                      ? patient.assignedBundles.join(', ')
                      : 'No bundles assigned'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    Last Active
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {patient.lastActive.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Delete Patient"
              onPress={handleDelete}
              variant="outline"
              size="medium"
              style={styles.deleteButton}
            />
            <Button
              title="Close"
              onPress={onClose}
              variant="primary"
              size="medium"
              style={styles.closeButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
  detailsContainer: {
    flex: 1,
  },
  detailCard: {
    marginBottom: SPACING.md,
  },
  detailSection: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  detailItem: {
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  deleteButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  closeButton: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
}); 