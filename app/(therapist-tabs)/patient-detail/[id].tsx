import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  condition?: string;
  therapistId: string;
  isAppUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const patientRef = doc(db, 'patients', id as string);
    const unsubscribe = onSnapshot(patientRef, (doc) => {
      if (doc.exists()) {
        setPatient({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Patient);
      } else {
        Alert.alert('Error', 'Patient not found');
        router.back();
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching patient:', error);
      Alert.alert('Error', 'Failed to load patient details');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, id]);

  const resendInvitation = async () => {
    if (!patient) return;

    try {
      Alert.alert('Coming soon', 'Invitation resend functionality will be added');
    } catch (error) {
      console.error('Error resending invitation:', error);
      Alert.alert('Error', 'Failed to resend invitation');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary }}>Patient not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{patient.name}</Text>
      </View>

      <Card variant="glow" style={styles.card}>
        <View style={styles.statusSection}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Status</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: patient.isAppUser ? colors.success : colors.warning }
          ]}>
            <Text style={styles.statusText}>
              {patient.isAppUser ? 'Active' : 'Pending'}
            </Text>
          </View>
          {!patient.isAppUser && (
            <Button
              title="Resend Invitation"
              onPress={resendInvitation}
              variant="outline"
              size="small"
              style={styles.resendButton}
            />
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Contact Information</Text>
          <Text style={[styles.info, { color: colors.text.secondary }]}>Email: {patient.email}</Text>
          <Text style={[styles.info, { color: colors.text.secondary }]}>Phone: {patient.phone}</Text>
        </View>

        {patient.condition && (
          <View style={styles.infoSection}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Condition</Text>
            <Text style={[styles.info, { color: colors.text.secondary }]}>{patient.condition}</Text>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Button
            title="Assign Exercises"
            onPress={() => router.push(`/assign-exercises/${patient.id}`)}
            variant="primary"
            size="large"
            style={styles.actionButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  card: {
    margin: SPACING.lg,
    padding: SPACING.lg,
  },
  statusSection: {
    marginBottom: SPACING.lg,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  info: {
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  statusText: {
    color: '#fff',
    fontFamily: FONTS.bold,
  },
  resendButton: {
    marginTop: SPACING.sm,
  },
  actionsSection: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    paddingTop: SPACING.lg,
  },
  actionButton: {
    width: '100%',
  },
}); 