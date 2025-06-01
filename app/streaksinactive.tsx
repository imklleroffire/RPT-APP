import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { db } from './config/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Streak } from './config/firebase';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay, parseISO } from 'date-fns';

interface StreakData extends Omit<Streak, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function StreaksScreen() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStreak();
  }, [user]);

  const fetchStreak = async () => {
    try {
      const streakRef = doc(db, 'streaks', user?.id || '');
      const streakDoc = await getDoc(streakRef);
      
      if (streakDoc.exists()) {
        const streakData = streakDoc.data() as StreakData;
        setStreak({
          ...streakData,
          createdAt: streakData.createdAt.toDate(),
          updatedAt: streakData.updatedAt.toDate(),
        });
      } else {
        // Create new streak document if it doesn't exist
        const newStreak: Streak = {
          id: user?.id || '',
          userId: user?.id || '',
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          streakHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setStreak(newStreak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
      Alert.alert('Error', 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const getMarkedDates = () => {
    if (!streak) return {};

    const markedDates: { [date: string]: any } = {};
    
    streak.streakHistory.forEach((history) => {
      const dateStr = format(history.date, 'yyyy-MM-dd');
      markedDates[dateStr] = {
        marked: true,
        dotColor: getStreakTypeColor(history.type),
      };
    });

    return markedDates;
  };

  const getStreakTypeColor = (type: 'start' | 'continue' | 'break' | 'freeze') => {
    switch (type) {
      case 'start':
        return '#4A90E2';
      case 'continue':
        return '#50E3C2';
      case 'break':
        return '#FF6B6B';
      case 'freeze':
        return '#F5A623';
      default:
        return '#4A90E2';
    }
  };

  const getStreakTypeText = (type: 'start' | 'continue' | 'break' | 'freeze') => {
    switch (type) {
      case 'start':
        return 'Streak Started';
      case 'continue':
        return 'Streak Continued';
      case 'break':
        return 'Streak Broken';
      case 'freeze':
        return 'Streak Frozen';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.streakHeader}>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{streak?.currentStreak || 0}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{streak?.longestStreak || 0}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Activity Calendar</Text>
        <Calendar
          markedDates={getMarkedDates()}
          theme={{
            todayTextColor: '#4A90E2',
            selectedDayBackgroundColor: '#4A90E2',
            selectedDayTextColor: '#ffffff',
            dotColor: '#4A90E2',
            monthTextColor: '#333333',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Streak History</Text>
        {streak?.streakHistory.map((history, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.historyItem,
              { borderLeftColor: getStreakTypeColor(history.type) },
            ]}
          >
            <View style={styles.historyContent}>
              <Text style={styles.historyDate}>
                {format(history.date, 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.historyType}>
                {getStreakTypeText(history.type)}
              </Text>
            </View>
            <Text style={styles.historyCount}>
              {history.completedBundles.length} bundles completed
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  streakCard: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  streakLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  calendarContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  historyContainer: {
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  historyType: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  historyCount: {
    fontSize: 12,
    color: '#666666',
  },
}); 