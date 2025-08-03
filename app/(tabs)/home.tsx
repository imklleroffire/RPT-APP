import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import ClinicDetailsModal from '../components/ClinicDetailsModal';

interface Clinic {
  id: string;
  name: string;
  therapistId: string;
  patientCount: number;
  createdAt: Date;
}

interface Stats {
  totalPatients: number;
  activePatients: number;
  pendingInvites: number;
  totalExercises: number;
}

export default function TherapistHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    activePatients: 0,
    pendingInvites: 0,
    totalExercises: 0,
  });
  const [isCreatingClinic, setIsCreatingClinic] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showClinicDetails, setShowClinicDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch clinic data
        const clinicsRef = collection(db, 'clinics');
        const q = query(clinicsRef, where('therapistId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const clinicData = querySnapshot.docs[0].data();
          setClinic({
            id: querySnapshot.docs[0].id,
            ...clinicData,
            createdAt: clinicData.createdAt.toDate(),
          } as Clinic);
        }

        // Fetch stats
        const patientsRef = collection(db, 'patients');
        const patientsQuery = query(patientsRef, where('therapistId', '==', user.id));
        const patientsSnapshot = await getDocs(patientsQuery);
        
        const exercisesRef = collection(db, 'exercises');
        const exercisesQuery = query(exercisesRef, where('therapistId', '==', user.id));
        const exercisesSnapshot = await getDocs(exercisesQuery);

        setStats({
          totalPatients: patientsSnapshot.size,
          activePatients: patientsSnapshot.docs.filter(doc => doc.data().isAppUser).length,
          pendingInvites: patientsSnapshot.docs.filter(doc => !doc.data().isAppUser).length,
          totalExercises: exercisesSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateClinic = async () => {
    if (!user || !clinicName.trim()) return;

    try {
      const clinicRef = doc(collection(db, 'clinics'));
      const clinicData = {
        name: clinicName.trim(),
        therapistId: user.id,
        patientCount: 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(clinicRef, clinicData);
      setClinic({
        id: clinicRef.id,
        ...clinicData,
        createdAt: new Date(),
      } as Clinic);
      setIsCreatingClinic(false);
      setClinicName('');
    } catch (error) {
      console.error('Error creating clinic:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.nameText, { color: colors.text.primary }]}>
            {user?.name || 'Therapist'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: colors.background.primary }]}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications" size={24} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Card variant="neon" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.totalPatients}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Total Patients
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.activePatients}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Active
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {stats.pendingInvites}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Pending
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Quick Actions
        </Text>
        <Card variant="glow" style={styles.actionsCard}>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => router.push('/patients')}
            >
              <Ionicons name="people-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => router.push('/exercises')}
            >
              <Ionicons name="fitness-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Clinic Management
        </Text>
        {!clinic ? (
          <Card variant="glow" style={styles.clinicCard}>
            <Text style={[styles.clinicText, { color: colors.text.secondary }]}>
              No clinic yet
            </Text>
            {!isCreatingClinic ? (
              <Button
                title="Create Clinic"
                onPress={() => setIsCreatingClinic(true)}
                variant="primary"
                size="medium"
                style={styles.createClinicButton}
              />
            ) : (
              <View style={styles.createClinicForm}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.primary,
                  }]}
                  placeholder="Enter clinic name"
                  placeholderTextColor={colors.text.secondary}
                  value={clinicName}
                  onChangeText={setClinicName}
                />
                <Button
                  title="Create"
                  onPress={handleCreateClinic}
                  variant="primary"
                  size="medium"
                  style={styles.createClinicButton}
                />
              </View>
            )}
          </Card>
        ) : (
          <Card variant="neon" style={styles.clinicCard}>
            <TouchableOpacity 
              style={styles.clinicContent}
              onPress={() => setShowClinicDetails(true)}
            >
              <View>
                <Text style={[styles.clinicName, { color: colors.text.primary }]}>
                  {clinic.name}
                </Text>
                <Text style={[styles.clinicStats, { color: colors.text.secondary }]}>
                  {stats.totalPatients} patients · {stats.totalExercises} exercises
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
          </Card>
        )}
      </View>

      {clinic && (
        <ClinicDetailsModal
          visible={showClinicDetails}
          onClose={() => setShowClinicDetails(false)}
          clinicId={clinic.id}
          clinicName={clinic.name}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: FONTS.sizes.lg,
  },
  header: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  nameText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  notificationButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  notificationBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  statsCard: {
    margin: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  actionsCard: {
    padding: SPACING.lg,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  clinicCard: {
    padding: SPACING.lg,
  },
  clinicText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  createClinicButton: {
    width: '100%',
  },
  createClinicForm: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
  },
  clinicContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clinicName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  clinicStats: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
}); 