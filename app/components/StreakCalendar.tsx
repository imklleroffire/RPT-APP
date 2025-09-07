import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { DailyCompletion } from '../types/streaks';

interface StreakCalendarProps {
  streakHistory: DailyCompletion[];
  onDayPress?: (date: string) => void;
}

export function StreakCalendar({ streakHistory, onDayPress }: StreakCalendarProps) {
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

        switch (history.streakStatus) {
          case 'maintained':
          case 'started':
            dotColor = colors.success; // Green
            selectedColor = colors.success;
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
          selected: isSameDay(date, today),
          selectedColor,
          customStyles: {
            container: {
              backgroundColor: selectedColor,
              borderRadius: 8,
            },
            text: {
              color: '#fff',
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

  const getDayComponent = (date: any) => {
    try {
      // Debug: Log the date structure to understand what we're working with
      console.log('[STREAKS] Date object structure:', JSON.stringify(date, null, 2));
      
      // Validate date parameter and access the correct date properties
      if (!date) {
        console.warn('[STREAKS] Invalid date parameter for day component:', date);
        return (
          <View style={styles.dayContainer}>
            <Text style={[styles.dayText, { color: colors.text.primary }]}>
              ?
            </Text>
          </View>
        );
      }

      // The date object from react-native-calendars has different structure
      // It can be {day: number, month: number, year: number, timestamp: number}
      // or {dateString: string, day: number, month: number, year: number, timestamp: number}
      let dateStr: string;
      let dayNumber: number;

      if (date.dateString) {
        // Newer version of react-native-calendars
        dateStr = date.dateString;
        dayNumber = date.day;
      } else if (date.timestamp) {
        // Older version or different format
        const dateObj = new Date(date.timestamp);
        dateStr = format(dateObj, 'yyyy-MM-dd');
        dayNumber = date.day || dateObj.getDate();
      } else if (date.day && date.month && date.year) {
        // Manual date construction
        const dateObj = new Date(date.year, date.month - 1, date.day);
        dateStr = format(dateObj, 'yyyy-MM-dd');
        dayNumber = date.day;
      } else {
        console.warn('[STREAKS] Unsupported date format:', date);
        return (
          <View style={styles.dayContainer}>
            <Text style={[styles.dayText, { color: colors.text.primary }]}>
              ?
            </Text>
          </View>
        );
      }
      
      // Find matching history item with proper date comparison
      const historyItem = streakHistory?.find(h => {
        if (!h || !h.date) return false;
        
        let historyDate: Date;
        if (typeof h.date === 'string') {
          historyDate = new Date(h.date);
        } else if (h.date instanceof Date) {
          historyDate = h.date;
        } else if (h.date && typeof h.date.toDate === 'function') {
          historyDate = h.date.toDate();
        } else {
          return false;
        }
        
        return !isNaN(historyDate.getTime()) && format(historyDate, 'yyyy-MM-dd') === dateStr;
      });
    
    let emoji = '';
    let backgroundColor = 'transparent';
    let textColor = colors.text.primary;

    if (historyItem) {
      switch (historyItem.streakStatus) {
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
    }

          return (
        <View style={[styles.dayContainer, { backgroundColor }]}>
          <Text style={[styles.dayText, { color: textColor }]}>
            {dayNumber}
          </Text>
          {emoji && (
            <Text style={styles.emojiText}>
              {emoji}
            </Text>
          )}
        </View>
      );
    } catch (error) {
      console.error('[STREAKS] Error in getDayComponent:', error);
      return (
        <View style={styles.dayContainer}>
          <Text style={[styles.dayText, { color: colors.text.primary }]}>
            {date?.day || '?'}
          </Text>
        </View>
      );
    }
  };

  // Check if we have valid streak history
  const hasValidHistory = streakHistory && Array.isArray(streakHistory) && streakHistory.length > 0;
  
  if (!hasValidHistory) {
    // Fallback to basic calendar without custom components
    return (
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
    );
  }

  return (
    <Calendar
      markedDates={getMarkedDates()}
      dayComponent={getDayComponent}
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
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 40,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emojiText: {
    fontSize: 10,
    position: 'absolute',
    bottom: 2,
  },
});
