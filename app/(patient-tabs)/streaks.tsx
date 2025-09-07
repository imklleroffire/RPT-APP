import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { streaksService } from '../services/streaksService';
import { StreakData, DailyCompletion } from '../types/streaks';
import { AestheticStreakCalendar } from '../components/AestheticStreakCalendar';

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  totalExercisesCompleted: number;
  averageCompletionRate: number;
  streakPercentage: number;
  bestWeek: {
    startDate: string;
    endDate: string;
    exercisesCompleted: number;
  };
  currentWeekProgress: {
    exercisesCompleted: number;
    totalAssigned: number;
    completionRate: number;
  };
}

export default function StreaksScreen() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const { user } = useAuth();
  const { colors } = useTheme();

  // Animation values
  const fireAnimation = useRef(new Animated.Value(1)).current;
  const streakNumberAnimation = useRef(new Animated.Value(0)).current;
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  const streakLostAnimation = useRef(new Animated.Value(0)).current;
  const fireworkAnimation = useRef(new Animated.Value(0)).current;
  
  // Previous streak values for comparison
  const previousStreakRef = useRef<{ current: number; longest: number }>({ current: 0, longest: 0 });

  useEffect(() => {
    if (user?.id) {
      try {
        console.log('[STREAKS] Setting up streak listener for user:', user.id);
        
        // Log timezone information for debugging
        const now = new Date();
        console.log('[STREAKS] Current timezone info:');
        console.log('[STREAKS] UTC time:', now.toISOString());
        console.log('[STREAKS] Local time:', now.toString());
        console.log('[STREAKS] Timezone offset (minutes):', now.getTimezoneOffset());
        console.log('[STREAKS] Local date string:', format(now, 'yyyy-MM-dd'));
        
        // Load previous streak values from database
        const loadPreviousStreakValues = async () => {
          try {
            const currentStreakData = await streaksService.getStreakData(user.id);
            if (currentStreakData) {
              previousStreakRef.current = {
                current: currentStreakData.currentStreak,
                longest: currentStreakData.longestStreak
              };
              console.log('[STREAKS] Loaded previous streak values:', previousStreakRef.current);
            }
          } catch (error) {
            console.error('[STREAKS] Error loading previous streak values:', error);
          }
        };
        
        // Initialize streak data if it doesn't exist, then recalculate
        try {
          streaksService.initializeStreakData(user.id).then(() => {
            loadPreviousStreakValues().then(() => {
              streaksService.recalculateAllStreakData(user.id);
            });
          }).catch(error => {
            console.error('[STREAKS] Error initializing streak data:', error);
          });
        } catch (error) {
          console.error('[STREAKS] Error in initialization setup:', error);
        }
        
        const unsubscribe = streaksService.listenToStreakData(user.id, (data) => {
          try {
            console.log('[STREAKS] Received streak data:', data);
            if (data && data.streakHistory) {
              console.log('[STREAKS] Streak history dates:', data.streakHistory.map(h => h.date));
              console.log('[STREAKS] Current date (local):', format(new Date(), 'yyyy-MM-dd'));
              console.log('[STREAKS] Current date (UTC):', format(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)), 'yyyy-MM-dd'));
            }
            
            // Check for streak broken before updating state
            if (data && previousStreakRef.current.current > 0 && data.currentStreak === 0) {
              console.log('[STREAKS] Streak broken detected! Previous:', previousStreakRef.current.current, 'Current:', data.currentStreak);
              setTimeout(() => {
                triggerStreakLostAnimation();
              }, 500); // Small delay to ensure UI is ready
            }
            
            setStreakData(data);
            setLoading(false);
            
            // Animate streak numbers when data changes
            if (data) {
              Animated.timing(streakNumberAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }).start();
              
              // Trigger celebration if user has a current streak when opening the tab
              if (data.currentStreak > 0 && previousStreakRef.current.current === 0) {
                // This is the first time loading with a streak
                setTimeout(() => {
                  if (data.currentStreak >= 5) {
                    triggerFireworkAnimation();
                  } else if (data.currentStreak > 0) {
                    triggerCelebrationAnimation();
                  }
                }, 1000); // Delay to let the initial animation finish
              }
            }
          } catch (error) {
            console.error('[STREAKS] Error processing streak data:', error);
            setLoading(false);
            setStreakData(null);
          }
        });

      return () => unsubscribe();
      } catch (error) {
        console.error('[STREAKS] Error setting up streak listener:', error);
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    // Animate fire emoji
    const animateFire = () => {
      Animated.sequence([
        Animated.timing(fireAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateFire, 2000);
      });
    };

    if (streakData?.currentStreak && streakData.currentStreak > 0) {
      animateFire();
    }
  }, [streakData?.currentStreak]);

  // Check for streak achievements and trigger animations
  useEffect(() => {
    if (!streakData) return;
    
    const previous = previousStreakRef.current;
    const current = streakData.currentStreak;
    const longest = streakData.longestStreak;
    
    // Check for new streak milestones (increments of 5)
    if (current > 0 && current % 5 === 0 && current > previous.current) {
      triggerFireworkAnimation();
    }
    
    // Check for new longest streak
    if (longest > previous.longest) {
      triggerCelebrationAnimation();
    }
    
    // Update previous values
    previousStreakRef.current = { current, longest };
  }, [streakData?.currentStreak, streakData?.longestStreak]);

  // Animation functions
  const triggerFireworkAnimation = () => {
    fireworkAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(fireworkAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fireworkAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerStreakLostAnimation = () => {
    streakLostAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(streakLostAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(streakLostAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerCelebrationAnimation = () => {
    celebrationAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const calculateStreakStats = (): StreakStats => {
    if (!streakData) {
      return {
            currentStreak: 0,
            longestStreak: 0,
        totalDaysActive: 0,
        totalExercisesCompleted: 0,
        averageCompletionRate: 0,
        streakPercentage: 0,
        bestWeek: { startDate: '', endDate: '', exercisesCompleted: 0 },
        currentWeekProgress: { exercisesCompleted: 0, totalAssigned: 0, completionRate: 0 }
      };
    }

        const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    // Calculate current week progress with safe date parsing
    const currentWeekHistory = streakData.streakHistory.filter(h => {
      try {
        const date = new Date(h.date + 'T00:00:00');
        return !isNaN(date.getTime()) && date >= weekStart && date <= weekEnd;
      } catch (error) {
        console.error('[STREAKS] Error parsing date in filter:', error);
        return false;
      }
    });
    
    const currentWeekExercises = currentWeekHistory.reduce((sum, h) => sum + h.totalCompleted, 0);
    const currentWeekAssigned = currentWeekHistory.reduce((sum, h) => sum + h.totalAssigned, 0);
    const currentWeekRate = currentWeekAssigned > 0 ? (currentWeekExercises / currentWeekAssigned) * 100 : 0;
    
    // Calculate streak percentage
    const totalDays = streakData.streakHistory.length;
    const streakDays = streakData.streakHistory.filter(h => 
      h.streakStatus === 'maintained' || h.streakStatus === 'started'
    ).length;
    const streakPercentage = totalDays > 0 ? (streakDays / totalDays) * 100 : 0;
    
    // Find best week with safe array operations
    const weeklyStats = calculateWeeklyStats(streakData.streakHistory);
    const bestWeek = weeklyStats.length > 0 
      ? weeklyStats.reduce((best, week) => 
          week.exercisesCompleted > best.exercisesCompleted ? week : best
        )
      : { startDate: '', endDate: '', exercisesCompleted: 0 };

    return {
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
      totalDaysActive: streakData.totalDaysActive,
      totalExercisesCompleted: streakData.totalExercisesCompleted,
      averageCompletionRate: streakData.averageCompletionRate,
      streakPercentage,
      bestWeek,
      currentWeekProgress: {
        exercisesCompleted: currentWeekExercises,
        totalAssigned: currentWeekAssigned,
        completionRate: currentWeekRate
      }
    };
  };

  const calculateWeeklyStats = (history: DailyCompletion[]) => {
    const weeklyStats: Array<{
      startDate: string;
      endDate: string;
      exercisesCompleted: number;
    }> = [];
    
    // Validate history array
    if (!history || !Array.isArray(history) || history.length === 0) {
      return weeklyStats;
    }
    
    const weekGroups = new Map<string, DailyCompletion[]>();
    
    history.forEach(day => {
      try {
        // Validate day object and date
        if (!day || !day.date) {
          console.warn('[STREAKS] Invalid day object:', day);
          return;
        }
        
        const date = new Date(day.date + 'T00:00:00');
        if (isNaN(date.getTime())) {
          console.error('[STREAKS] Invalid date in history:', day.date);
          return;
        }
        
        const weekStart = startOfWeek(date);
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, []);
        }
        weekGroups.get(weekKey)!.push(day);
      } catch (error) {
        console.error('[STREAKS] Error processing history item:', error);
      }
    });
    
    weekGroups.forEach((days, weekKey) => {
      try {
        const weekStart = new Date(weekKey);
        if (isNaN(weekStart.getTime())) {
          console.error('[STREAKS] Invalid week start date:', weekKey);
          return;
        }
        
        const weekEnd = endOfWeek(weekStart);
        const exercisesCompleted = days.reduce((sum, day) => sum + (day?.totalCompleted || 0), 0);
        
        weeklyStats.push({
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          exercisesCompleted
        });
      } catch (error) {
        console.error('[STREAKS] Error processing week group:', error);
      }
    });
    
    return weeklyStats;
  };

  const getMarkedDates = () => {
    if (!streakData || !streakData.streakHistory) return {};

    const markedDates: { [date: string]: any } = {};
    // Use local timezone for today to ensure consistent comparison
    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));

    // Validate streakHistory is an array
    if (!Array.isArray(streakData.streakHistory)) {
      console.warn('[STREAKS] streakHistory is not an array:', streakData.streakHistory);
      return markedDates;
    }

    streakData.streakHistory.forEach((history, index) => {
      try {
        // Validate history object
        if (!history || !history.date) {
          console.warn('[STREAKS] Invalid history item at index', index, history);
          return;
        }
        
        const date = new Date(history.date + 'T00:00:00');
        if (isNaN(date.getTime())) {
          console.error('[STREAKS] Invalid date in history for calendar:', history.date);
          return;
        }
        
        const dateStr = format(date, 'yyyy-MM-dd');
        let emoji = '😐'; // Default neutral
        let backgroundColor = colors.background.secondary;
        let textColor = colors.text.secondary;

        switch (history.streakStatus) {
          case 'maintained':
          case 'started':
            emoji = '🔥';
            backgroundColor = colors.success;
            textColor = '#fff';
            break;
          case 'broken':
            emoji = '❌';
            backgroundColor = colors.error;
            textColor = '#fff';
            break;
          case 'none':
            emoji = '😐';
            backgroundColor = colors.background.secondary;
            textColor = colors.text.secondary;
            break;
        }

        markedDates[dateStr] = {
          marked: true,
          dotColor: backgroundColor,
          selected: isSameDay(date, localToday),
          selectedColor: backgroundColor,
          customStyles: {
            container: {
              backgroundColor,
              borderRadius: BORDER_RADIUS.sm,
            },
            text: {
              color: textColor,
              fontWeight: 'bold',
            },
          },
        };
      } catch (error) {
        console.error('[STREAKS] Error processing history for calendar:', error);
      }
    });

    return markedDates;
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '🎯';
    return '🌟';
  };

  const getMotivationalMessage = (streak: number): string => {
    if (streak >= 30) return 'You\'re a legend! Keep it up!';
    if (streak >= 14) return 'Two weeks strong! Amazing work!';
    if (streak >= 7) return 'A full week! You\'re on fire!';
    if (streak >= 3) return 'Great start! Keep the momentum!';
    if (streak > 0) return 'You\'ve got this! Every day counts!';
    return 'Start your streak today!';
  };

  const stats = calculateStreakStats();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading your streak data...
        </Text>
      </View>
    );
  }

  // Fallback UI if no streak data
  if (!streakData) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.heroSection}>
          <Card variant="neon" style={styles.heroCard}>
            <Text style={[styles.fireEmoji, { fontSize: 48 }]}>🌟</Text>
            <Text style={[styles.currentStreakNumber, { color: colors.primary }]}>0</Text>
            <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>Day Streak</Text>
            <Text style={[styles.motivationalText, { color: colors.text.primary }]}>
              Start your streak today! Complete all your assigned exercises to begin.
            </Text>
          </Card>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Get Started
          </Text>
          <Card variant="glow" style={styles.weekProgressCard}>
            <Text style={[styles.progressTitle, { color: colors.text.primary }]}>
              Complete your first exercise bundle to start building your streak!
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.text.secondary }]}>
              Go to the "Assigned Bundles" tab to see your exercises.
            </Text>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Card variant="neon" style={styles.heroCard}>
          <View style={styles.streakDisplay}>
            <Animated.View style={[styles.fireContainer, { transform: [{ scale: fireAnimation }] }]}>
              <Text style={styles.fireEmoji}>{getStreakEmoji(stats.currentStreak)}</Text>
            </Animated.View>
            <Animated.Text 
              style={[
                styles.currentStreakNumber, 
                { color: colors.primary },
                { transform: [{ scale: streakNumberAnimation }] }
              ]}
            >
              {stats.currentStreak}
            </Animated.Text>
            <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>
              Day{stats.currentStreak !== 1 ? 's' : ''} Streak
            </Text>
            <Text style={[styles.motivationalText, { color: colors.text.primary }]}>
              {getMotivationalMessage(stats.currentStreak)}
            </Text>
          </View>
        </Card>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card variant="glow" style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {stats.longestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Longest Streak
          </Text>
          <Text style={styles.statEmoji}>🏆</Text>
        </Card>

        <Card variant="glow" style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {stats.totalExercisesCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total Exercises
          </Text>
          <Text style={styles.statEmoji}>💪</Text>
        </Card>

        <Card variant="glow" style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {Math.round(stats.averageCompletionRate)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Avg. Completion
          </Text>
          <Text style={styles.statEmoji}>📊</Text>
        </Card>

        <Card variant="glow" style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {stats.totalDaysActive}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Active Days
          </Text>
          <Text style={styles.statEmoji}>📅</Text>
        </Card>
      </View>

      {/* This Week Progress */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          This Week's Progress
        </Text>
        <Card variant="neon" style={styles.weekProgressCard}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text.primary }]}>
              Weekly Goal
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.text.secondary }]}>
              {stats.currentWeekProgress.exercisesCompleted} / {stats.currentWeekProgress.totalAssigned} exercises
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(stats.currentWeekProgress.completionRate, 100)}%`,
                  backgroundColor: colors.primary 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressPercentage, { color: colors.primary }]}>
            {Math.round(stats.currentWeekProgress.completionRate)}% Complete
          </Text>
        </Card>
      </View>

      {/* Calendar Section */}
      <View style={styles.section}>
        <View style={styles.calendarHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Activity Calendar
          </Text>
          <Button
            title={showCalendar ? "Hide" : "Show"}
            onPress={() => setShowCalendar(!showCalendar)}
            variant="outline"
            size="small"
          />
        </View>
        
        {showCalendar && (
          <Card variant="glow" style={styles.calendarCard}>
            {streakData && streakData.streakHistory ? (
              <AestheticStreakCalendar 
                streakHistory={streakData.streakHistory}
                onDayPress={(date: string) => {
                  console.log('[STREAKS] Calendar day pressed:', date);
                }}
              />
            ) : (
              <View style={styles.calendarFallback}>
                <Text style={[styles.calendarFallbackText, { color: colors.text.secondary }]}>
                  No streak data available yet. Complete some exercises to see your progress!
                </Text>
              </View>
            )}
          </Card>
        )}
      </View>



      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recent Activity
        </Text>
        {streakData?.streakHistory
          .filter(history => history.totalCompleted > 0)
          .slice(-5)
          .reverse()
          .map((history, index) => (
            <Card key={index} variant="glow" style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={[styles.activityDate, { color: colors.text.primary }]}>
                  {format(new Date(history.date + 'T00:00:00'), 'MMMM dd, yyyy')}
                </Text>
                <Text style={styles.activityEmoji}>
                  {history.streakStatus === 'maintained' || history.streakStatus === 'started' ? '🔥' : '✅'}
                </Text>
              </View>
              <Text style={[styles.activityDetails, { color: colors.text.secondary }]}>
                Completed {history.totalCompleted} of {history.totalAssigned} exercises
              </Text>
              <Text style={[styles.activityRate, { color: colors.primary }]}>
                {Math.round(history.completionRate)}% completion rate
              </Text>
            </Card>
          ))}
      </View>
      
      {/* Animated Overlays */}
      {/* Firework Animation for Streak Milestones */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fireworkAnimation,
            transform: [{ scale: fireworkAnimation }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationEmoji}>🎆</Text>
          <Text style={[styles.celebrationText, { color: colors.primary }]}>
            Streak Milestone!
          </Text>
        </View>
      </Animated.View>

      {/* Streak Lost Animation */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: streakLostAnimation,
            transform: [{ scale: streakLostAnimation }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.streakLostContainer}>
          <Text style={styles.streakLostEmoji}>❌</Text>
          <Text style={[styles.streakLostText, { color: colors.error }]}>
            Streak Broken!
          </Text>
        </View>
      </Animated.View>

      {/* Celebration Animation for New Longest Streak */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: celebrationAnimation,
            transform: [{ scale: celebrationAnimation }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationEmoji}>🏆</Text>
          <Text style={[styles.celebrationText, { color: colors.success }]}>
            New Longest Streak!
          </Text>
        </View>
      </Animated.View>
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  heroSection: {
    padding: SPACING.lg,
  },
  heroCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  streakDisplay: {
    alignItems: 'center',
  },
  fireContainer: {
    marginBottom: SPACING.md,
  },
  fireEmoji: {
    fontSize: 48,
  },
  currentStreakNumber: {
    fontSize: 64,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  streakLabel: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  motivationalText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.lg,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  statEmoji: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    fontSize: 20,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  calendarCard: {
    padding: SPACING.md,
  },
  calendarEmoji: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  emojiText: {
    fontSize: 12,
  },
  weekProgressCard: {
    padding: SPACING.lg,
  },
  progressHeader: {
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  progressSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  legendCard: {
    padding: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  legendEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  legendText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
  },
  activityCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activityDate: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityDetails: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  activityRate: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  calendarFallback: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  calendarFallbackText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Animation overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  celebrationText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  streakLostContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  streakLostEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  streakLostText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
});