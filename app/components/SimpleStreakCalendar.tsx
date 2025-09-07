import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { DailyCompletion } from '../types/streaks';

interface SimpleStreakCalendarProps {
  streakHistory: DailyCompletion[];
  onDayPress?: (date: string) => void;
}

export function SimpleStreakCalendar({ streakHistory, onDayPress }: SimpleStreakCalendarProps) {
  const { colors } = useTheme();

  const getMarkedDates = () => {
    const markedDates: { [date: string]: any } = {};
    const today = new Date();

    // Validate streakHistory exists and is an array
    if (!streakHistory || !Array.isArray(streakHistory)) {
      console.warn('[STREAKS] Invalid streakHistory for calendar:', streakHistory);
      return markedDates;
    }

    streakHistory.forEach((history, index) => {
      try {
        // Validate history object
        if (!history || !history.date) {
          console.warn('[STREAKS] Invalid history item at index', index, history);
          return;
        }

        // Try multiple date parsing approaches
        let date: Date;
        if (typeof history.date === 'string') {
          date = new Date(history.date);
        } else if (history.date instanceof Date) {
          date = history.date;
        } else if (history.date && typeof history.date.toDate === 'function') {
          // Firestore timestamp
          date = history.date.toDate();
        } else {
          console.warn('[STREAKS] Unsupported date format at index', index, history.date);
          return;
        }

        if (isNaN(date.getTime())) {
          console.error('[STREAKS] Invalid date in history for calendar:', history.date);
          return;
        }
        
        const dateStr = format(date, 'yyyy-MM-dd');
        
        let dotColor = colors.text.secondary; // Default gray
        let selectedColor = colors.background.secondary;
        let textColor = colors.text.primary;

        switch (history.streakStatus) {
          case 'maintained':
          case 'started':
            dotColor = colors.success; // Green
            selectedColor = colors.success;
            textColor = '#fff';
            break;
          case 'broken':
            dotColor = colors.error; // Red
            selectedColor = colors.error;
            textColor = '#fff';
            break;
          case 'none':
            dotColor = colors.text.secondary; // Gray
            selectedColor = colors.background.secondary;
            textColor = colors.text.secondary;
            break;
        }

        markedDates[dateStr] = {
          marked: true,
          dotColor,
          selected: isSameDay(date, today),
          selectedColor,
          customStyles: {
            container: {
              backgroundColor: selectedColor,
              borderRadius: 8,
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

  // Check if we have valid streak history
  const hasValidHistory = streakHistory && Array.isArray(streakHistory) && streakHistory.length > 0;
  
  if (!hasValidHistory) {
    // Fallback to basic calendar without custom components
    return (
      <View style={styles.container}>
        <Calendar
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
          onDayPress={onDayPress}
        />
        <View style={styles.fallbackMessage}>
          <Text style={[styles.fallbackText, { color: colors.text.secondary }]}>
            Complete some exercises to see your streak progress!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        onDayPress={onDayPress}
      />
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            🔥 Streak maintained/started
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            ❌ Streak broken
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.text.secondary }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            😐 No activity
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackMessage: {
    padding: 20,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  legend: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
});
