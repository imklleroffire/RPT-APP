import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Exercise {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completedAt?: Date;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  completed?: boolean;
}

interface Therapist {
  id: string;
  name: string;
  email: string;
  specialization?: string;
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadCount, notifications, createTestNotification } = useNotifications();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [assignedBundles, setAssignedBundles] = useState<Bundle[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug notifications
  useEffect(() => {
    console.log('[PATIENT_HOME] Notification state:', {
      unreadCount,
      totalNotifications: notifications.length,
      user: user?.id,
      userEmail: user?.email
    });
  }, [unreadCount, notifications.length, user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch exercises
        const exercisesRef = collection(db, 'exercises');
        const exercisesQuery = query(exercisesRef, where('assignedTo', 'array-contains', user.id));
        const exercisesSnapshot = await getDocs(exercisesQuery);
        
        const exerciseData = exercisesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Exercise[];

        setExercises(exerciseData);
        
        // Get recent exercises (last 5 completed)
        const recentOnes = exerciseData
          .filter(e => e.completedAt)
          .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
          .slice(0, 5);
        setRecentExercises(recentOnes);

        // Fetch assigned bundles
        const bundlesRef = collection(db, 'bundles');
        const bundlesQuery = query(bundlesRef, where('assignedPatients', 'array-contains', user.id));
        const bundlesSnapshot = await getDocs(bundlesQuery);
        
        const bundleData = bundlesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bundle[];
        setAssignedBundles(bundleData);

        // Fetch therapist info
        if (user.therapistId) {
          const therapistDoc = await getDoc(doc(db, 'therapists', user.therapistId));
          if (therapistDoc.exists()) {
            setTherapists([{
              id: therapistDoc.id,
              ...therapistDoc.data()
            } as Therapist]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            {user?.name || 'Patient'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: colors.background.primary }]}
          onPress={() => {
            console.log('[PATIENT_HOME] Notification button pressed');
            console.log('[PATIENT_HOME] Current notifications:', notifications);
            console.log('[PATIENT_HOME] Unread count:', unreadCount);
            router.push('/notifications');
          }}
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Your Therapists
        </Text>
        {therapists.length > 0 ? (
          therapists.map(therapist => (
            <Card key={therapist.id} variant="neon" style={styles.therapistCard}>
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
              <Button
                title="View Profile"
                onPress={() => router.push(`/therapist-profile/${therapist.id}`)}
                variant="outline"
                size="small"
                style={styles.viewButton}
              />
            </Card>
          ))
        ) : (
          <Card variant="neon" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No therapists assigned yet
            </Text>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => router.push('/assigned-bundles')}
          >
            <Ionicons name="fitness" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text.primary }]}>
              Exercise Bundles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => router.push('/streaks')}
          >
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text.primary }]}>
              View Streaks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={async () => {
              console.log('[PATIENT_HOME] Creating test notification...');
              await createTestNotification();
              console.log('[PATIENT_HOME] Test notification created');
            }}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text.primary }]}>
              Test Notification
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Card variant="neon" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {exercises.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Assigned
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {exercises.filter(e => e.completedAt).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {exercises.filter(e => !e.completedAt).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Pending
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Assigned Bundles
        </Text>
        {assignedBundles.length === 0 ? (
          <Card variant="glow" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No bundles assigned yet
            </Text>
          </Card>
        ) : (
          assignedBundles.map((bundle) => (
            <TouchableOpacity
              key={bundle.id}
              onPress={() => router.push(`/bundles/${bundle.id}`)}
            >
              <Card variant="neon" style={styles.bundleCard}>
                <Image
                  source={{ uri: bundle.coverImage }}
                  style={styles.bundleImage}
                />
                <View style={styles.bundleContent}>
                  <Text style={[styles.bundleName, { color: colors.text.primary }]}>
                    {bundle.name}
                  </Text>
                  <Text style={[styles.bundleDescription, { color: colors.text.secondary }]}>
                    {bundle.description}
                  </Text>
                  <View style={styles.bundleMeta}>
                    <Text style={[styles.exerciseCount, { color: colors.text.secondary }]}>
                      {bundle.exercises.length} exercises
                    </Text>
                    {bundle.completed && (
                      <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recent Activity
        </Text>
        {recentExercises.length === 0 ? (
          <Card variant="glow" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No exercises completed yet
            </Text>
          </Card>
        ) : (
          recentExercises.map((exercise) => (
            <Card key={exercise.id} variant="neon" style={styles.exerciseCard}>
              <Image
                source={{ uri: exercise.imageUrl }}
                style={styles.exerciseImage}
              />
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseDescription, { color: colors.text.secondary }]}>
                  {exercise.description}
                </Text>
                <View style={styles.exerciseMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                    <Text style={styles.difficultyText}>
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.duration, { color: colors.text.secondary }]}>
                    {exercise.duration} min
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 10,
    borderRadius: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  therapistCard: {
    marginBottom: 12,
    padding: 16,
  },
  therapistInfo: {
    marginBottom: 12,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  therapistEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  therapistSpecialization: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  viewButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
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
  bundleCard: {
    marginBottom: SPACING.md,
  },
  bundleImage: {
    width: '100%',
    height: 150,
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
  bundleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  completedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  completedText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  exerciseCard: {
    marginBottom: SPACING.md,
  },
  exerciseImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  exerciseContent: {
    padding: SPACING.md,
  },
  exerciseName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  exerciseDescription: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  duration: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 2,
    borderRadius: 10,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
});