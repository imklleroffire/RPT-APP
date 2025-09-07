import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { AssignedBundleModal } from '../components/AssignedBundleModal';
import { isSameDay, addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { showAlert } from '../utils/alerts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Exercise {
  name: string;
  reps?: number;
  duration?: number;
  description?: string;
  instructions?: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  exercises: Exercise[];
  completed?: boolean;
  lastCompletedDate?: Date | null;
}

interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakHistory: { date: Date; type: string; completedBundles: string[] }[];
}

export default function AssignedBundlesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [bundleCompletedToday, setBundleCompletedToday] = useState(false);

  useEffect(() => {
    fetchAssignedBundles();
  }, [user?.id]);

  const fetchAssignedBundles = async () => {
    if (!user?.id) return;

    try {
      const bundlesQuery = query(
        collection(db, 'bundles'),
        where('assignedPatients', 'array-contains', user.id)
      );
      const bundlesSnapshot = await getDocs(bundlesQuery);

      const bundlesList = bundlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Bundle[];

      // Check completion status for each bundle
      const bundlesWithCompletionStatus = await Promise.all(
        bundlesList.map(async (bundle) => {
          try {
            const bundleRef = doc(db, 'completedExercises', `${user.id}_${bundle.id}`);
            const bundleDoc = await getDoc(bundleRef);

            if (bundleDoc.exists()) {
              const data = bundleDoc.data();
              const lastCompletedDate = data.lastCompletedDate?.toDate();
              const today = new Date();

              // Check if bundle was completed today
              const isCompletedToday = lastCompletedDate && isSameDay(today, lastCompletedDate);
              
              return {
                ...bundle,
                completed: isCompletedToday,
                lastCompletedDate: lastCompletedDate
              };
            } else {
              return {
                ...bundle,
                completed: false,
                lastCompletedDate: null
              };
            }
          } catch (error) {
            console.error(`Error checking completion status for bundle ${bundle.id}:`, error);
            return {
              ...bundle,
              completed: false,
              lastCompletedDate: null
            };
          }
        })
      );

      setBundles(bundlesWithCompletionStatus);
    } catch (error) {
      console.error('Error fetching assigned bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBundle = async (bundleId: string) => {
    console.log('[ASSIGNED_BUNDLES] handleCompleteBundle called with bundleId:', bundleId);
    console.log('[ASSIGNED_BUNDLES] user?.id:', user?.id);
    
    try {
      const today = new Date();
      
      // Update bundle completion status
      setBundles(currentBundles =>
        currentBundles.map(bundle =>
          bundle.id === bundleId ? { 
            ...bundle, 
            completed: true,
            lastCompletedDate: today
          } : bundle
        )
      );

      console.log('[ASSIGNED_BUNDLES] Bundle state updated');
      showAlert('Success', 'Bundle completed successfully!');
      setDetailsModalVisible(false);
      
      // Note: Streaks are now handled by the AssignedBundleModal when exercises are completed
      // This prevents duplicate streak calculations
    } catch (error) {
      console.error('[ASSIGNED_BUNDLES] Error completing bundle:', error);
      showAlert('Error', 'Failed to complete bundle. Please try again.');
    }
  };

  const renderBundleCard = (bundle: Bundle) => {
    const isComplete = bundle.completed;

    return (
      <Card key={bundle.id} variant="glow" style={styles.bundleCard}>
        <Image
          source={{ uri: bundle.coverImage }}
          style={styles.bundleCover}
          resizeMode="cover"
        />
        <View style={styles.bundleContent}>
          <View style={styles.bundleHeader}>
            <Text style={[styles.bundleName, { color: colors.text.primary }]}>
              {bundle.name}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isComplete ? colors.success : colors.warning }
            ]}>
              <Text style={styles.statusText}>
                {isComplete ? 'Complete' : 'In Progress'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.bundleDescription, { color: colors.text.secondary }]}>
            {bundle.description}
          </Text>

          <View style={styles.exerciseCount}>
            <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            <Text style={[styles.exerciseCountText, { color: colors.text.secondary }]}>
              {bundle.exercises && Array.isArray(bundle.exercises) ? bundle.exercises.length : 0} exercises
            </Text>
          </View>

          <Button
            title="View Exercises"
            onPress={() => {
              setSelectedBundle(bundle);
              setDetailsModalVisible(true);
            }}
            variant="neon"
            size="small"
            style={styles.viewButton}
            icon="arrow-forward"
          />
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (bundles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="fitness-outline" size={48} color={colors.text.secondary} />
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          No bundles assigned yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Exercise Bundles
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {bundles.map(renderBundleCard)}
      </ScrollView>

      {selectedBundle && (
        <AssignedBundleModal
          visible={detailsModalVisible}
          exercises={selectedBundle.exercises && Array.isArray(selectedBundle.exercises) ? selectedBundle.exercises : []}
          bundleId={selectedBundle.id}
          userId={user?.id || ''}
          onClose={() => setDetailsModalVisible(false)}
          onComplete={() => handleCompleteBundle(selectedBundle.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  bundleCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  bundleCover: {
    width: '100%',
    height: 160,
  },
  bundleContent: {
    padding: SPACING.lg,
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bundleName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    color: '#fff',
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
  },
  bundleDescription: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  exerciseCountText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  viewButton: {
    alignSelf: 'flex-start',
  },
});