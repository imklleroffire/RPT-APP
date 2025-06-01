import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/ui/Card';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakHistory: {
    date: Date;
    completedBundles: string[];
    streakStatus: 'started' | 'continued' | 'broken' | 'none';
  }[];
}

export default function StreaksScreen() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = setupStreakListener();
      return () => unsubscribe();
    }
  }, [user?.id]);

  const setupStreakListener = () => {
    if (!user?.id) return () => {};

    // Listen for streak data changes
    const streakRef = doc(db, 'streaks', user.id);
    const unsubscribeStreak = onSnapshot(streakRef, async (streakDoc) => {
      try {
        let streakData: StreakData;
        
        if (streakDoc.exists()) {
          const data = streakDoc.data();
          streakData = {
            currentStreak: data.currentStreak || 0,
            longestStreak: data.longestStreak || 0,
            lastActivityDate: data.lastActivityDate?.toDate() || new Date(),
            streakHistory: (data.streakHistory || []).map((item: any) => ({
              date: item.date.toDate(),
              completedBundles: item.completedBundles || [],
              streakStatus: item.streakStatus || 'none',
            })),
          };
        } else {
          streakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: new Date(),
            streakHistory: [],
          };
        }

        // Get today's completed bundles
        const today = new Date();
        const completedBundlesRef = collection(db, 'completedExercises');
        const q = query(
          completedBundlesRef,
          where('userId', '==', user.id),
          where('completedAt', '>=', startOfDay(today)),
          where('completedAt', '<=', endOfDay(today))
        );

        try {
          const completedBundlesSnapshot = await getDocs(q);
          const todayCompletedBundles = completedBundlesSnapshot.docs.map(doc => doc.id);

          // Update streak if bundles were completed today
          if (todayCompletedBundles.length > 0) {
            const lastActivity = streakData.lastActivityDate;
            const yesterday = subDays(today, 1);

            if (isSameDay(lastActivity, yesterday)) {
              // Continue streak
              streakData.currentStreak += 1;
              streakData.longestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);
              streakData.streakHistory.push({
                date: today,
                completedBundles: todayCompletedBundles,
                streakStatus: 'continued',
              });
            } else if (!isSameDay(lastActivity, today)) {
              // Start new streak
              streakData.currentStreak = 1;
              streakData.streakHistory.push({
                date: today,
                completedBundles: todayCompletedBundles,
                streakStatus: 'started',
              });
            }

            streakData.lastActivityDate = today;
          } else {
            // Check if streak was broken
            const lastActivity = streakData.lastActivityDate;
            const yesterday = subDays(today, 1);
            
            if (isSameDay(lastActivity, yesterday) && streakData.currentStreak > 0) {
              streakData.streakHistory.push({
                date: today,
                completedBundles: [],
                streakStatus: 'broken',
              });
              streakData.currentStreak = 0;
            } else {
              streakData.streakHistory.push({
                date: today,
                completedBundles: [],
                streakStatus: 'none',
              });
            }
          }

          // Update streak data in Firestore
          await setDoc(streakRef, {
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
            lastActivityDate: Timestamp.fromDate(today),
            streakHistory: streakData.streakHistory.map(item => ({
              date: Timestamp.fromDate(item.date),
              completedBundles: item.completedBundles,
              streakStatus: item.streakStatus,
            })),
          });

          setStreakData(streakData);
        } catch (error: any) {
          console.error('Error updating streak data:', error);
          if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
            // Extract the index creation URL from the error message
            const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
            if (indexUrl) {
              console.log('Please create the required index at:', indexUrl);
              // You might want to show this URL to the user or handle it in a more user-friendly way
            }
          }
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error updating streak data:', error);
      }
    });

    return () => {
      unsubscribeStreak();
    };
  };

  const getMarkedDates = () => {
    if (!streakData) return {};

    const markedDates: { [date: string]: any } = {};
    const today = new Date();

    streakData.streakHistory.forEach((history) => {
      const dateStr = format(history.date, 'yyyy-MM-dd');
      let dotColor = colors.text.secondary; // Default gray
      let selectedColor = colors.background.secondary;

      switch (history.streakStatus) {
        case 'started':
          dotColor = colors.success; // Green
          selectedColor = colors.success;
          break;
        case 'continued':
          dotColor = colors.warning; // Orange
          selectedColor = colors.warning;
          break;
        case 'broken':
          dotColor = colors.error; // Red
          selectedColor = colors.error;
          break;
        case 'none':
          dotColor = colors.text.secondary; // Gray
          selectedColor = colors.background.secondary;
          break;
      }

      markedDates[dateStr] = {
        marked: true,
        dotColor,
        selected: isSameDay(history.date, today),
        selectedColor,
        customStyles: {
          container: {
            backgroundColor: selectedColor,
          },
          text: {
            color: '#fff',
          },
        },
      };
    });

    return markedDates;
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
      <View style={styles.streakHeader}>
        <Card variant="neon" style={styles.streakCard}>
          <Text style={[styles.streakNumber, { color: colors.primary }]}>
            {streakData?.currentStreak || 0}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>
            Current Streak
          </Text>
        </Card>
        <Card variant="neon" style={styles.streakCard}>
          <Text style={[styles.streakNumber, { color: colors.primary }]}>
            {streakData?.longestStreak || 0}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>
            Longest Streak
          </Text>
        </Card>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Activity Calendar
        </Text>
        <Calendar
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: colors.background.primary,
            calendarBackground: colors.background.primary,
            textSectionTitleColor: colors.text.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.background.primary,
            todayTextColor: colors.primary,
            dayTextColor: colors.text.primary,
            textDisabledColor: colors.text.secondary,
            dotColor: colors.success,
            selectedDotColor: colors.background.primary,
            arrowColor: colors.primary,
            monthTextColor: colors.text.primary,
            indicatorColor: colors.primary,
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
        />
      </View>

      <View style={styles.historyContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recent Activity
        </Text>
        {streakData?.streakHistory
          .filter(history => history.completedBundles.length > 0)
          .slice(-5)
          .reverse()
          .map((history, index) => (
            <Card key={index} variant="neon" style={styles.historyCard}>
              <Text style={[styles.historyDate, { color: colors.text.primary }]}>
                {format(history.date, 'MMMM dd, yyyy')}
              </Text>
              <Text style={[styles.historyBundles, { color: colors.text.secondary }]}>
                Completed {history.completedBundles.length} bundle{history.completedBundles.length !== 1 ? 's' : ''}
              </Text>
            </Card>
          ))}
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
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  streakCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 14,
  },
  calendarContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyContainer: {
    padding: 20,
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyBundles: {
    fontSize: 14,
  },
});