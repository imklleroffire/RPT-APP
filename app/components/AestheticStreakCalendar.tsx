import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { DailyCompletion } from '../types/streaks';

interface AestheticStreakCalendarProps {
  streakHistory: DailyCompletion[];
  onDayPress?: (date: string) => void;
}

export function AestheticStreakCalendar({ streakHistory, onDayPress }: AestheticStreakCalendarProps) {
  const { colors } = useTheme();

  const getMarkedDates = () => {
    const markedDates: { [date: string]: any } = {};
    // Use local timezone for today to ensure consistent comparison
    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));

    console.log('[CALENDAR] getMarkedDates called');
    console.log('[CALENDAR] Today (UTC):', today.toISOString());
    console.log('[CALENDAR] Today (Local):', localToday.toISOString());
    console.log('[CALENDAR] Streak history dates:', streakHistory?.map(h => h.date));

    if (!streakHistory || !Array.isArray(streakHistory)) {
      return markedDates;
    }

    streakHistory.forEach((history) => {
      try {
        if (!history || !history.date) return;

        let date: Date;
        if (typeof history.date === 'string') {
          // Parse date string and ensure it's treated as local time
          // Add time component to prevent timezone shift
          date = new Date(history.date + 'T00:00:00');
        } else if (history.date && typeof history.date === 'object' && 'toDate' in history.date) {
          date = (history.date as any).toDate();
        } else {
          return;
        }

        if (isNaN(date.getTime())) return;
        
        // Use the original date string to avoid any timezone conversion issues
        const dateStr = history.date;
        const completionRate = history.completionRate || 0;
        
        let completionType = 'none';
        if (completionRate === 100) {
          completionType = 'full';
        } else if (completionRate > 0 && completionRate < 100) {
          completionType = 'partial';
        } else if (history.streakStatus === 'broken') {
          completionType = 'broken';
        }

        // Debug logging
        console.log(`[CALENDAR] Processing date: ${dateStr}, parsed as: ${date.toISOString()}, completion: ${completionRate}%, type: ${completionType}`);

        markedDates[dateStr] = {
          marked: true,
          completionType,
          completionRate,
          streakStatus: history.streakStatus,
          selected: isSameDay(date, localToday),
        };
      } catch (error) {
        console.error('[STREAKS] Error processing history:', error);
      }
    });

    return markedDates;
  };

  const CustomDayComponent = ({ date, marking }: any) => {
    if (!date || !date.dateString) {
      return (
        <View style={styles.dayContainer}>
          <Text style={[styles.dayText, { color: colors.text.primary }]}>
            {date?.day || '?'}
          </Text>
        </View>
      );
    }

    const dayNumber = date.day;
    const markingData = marking || {};

    let strikethroughColor = 'transparent';
    let strikethroughWidth = 0;
    let showX = false;
    let backgroundColor = 'transparent';

    switch (markingData.completionType) {
      case 'full':
        strikethroughColor = colors.success;
        strikethroughWidth = 3;
        backgroundColor = 'rgba(76, 175, 80, 0.1)';
        break;
      case 'partial':
        strikethroughColor = '#FFD700';
        strikethroughWidth = 3;
        backgroundColor = 'rgba(255, 215, 0, 0.1)';
        break;
      case 'broken':
        showX = true;
        backgroundColor = 'rgba(244, 67, 54, 0.1)';
        break;
      case 'none':
        strikethroughColor = colors.text.secondary;
        strikethroughWidth = 2;
        backgroundColor = 'rgba(158, 158, 158, 0.05)';
        break;
    }

    return (
      <View style={[styles.dayContainer, { backgroundColor }]}>
        <Text style={[styles.dayText, { color: colors.text.primary }]}>
          {dayNumber}
        </Text>
        
        {strikethroughWidth > 0 && (
          <View
            style={[
              styles.strikethrough,
              {
                backgroundColor: strikethroughColor,
                height: strikethroughWidth,
              },
            ]}
          />
        )}
        
        {showX && (
          <Text style={styles.brokenX}>❌</Text>
        )}
      </View>
    );
  };

  const hasValidHistory = streakHistory && Array.isArray(streakHistory) && streakHistory.length > 0;
  
  if (!hasValidHistory) {
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
          onDayPress={(day) => onDayPress?.(day.dateString)}
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
        dayComponent={CustomDayComponent}
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
        onDayPress={(day) => onDayPress?.(day.dateString)}
      />
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.success, height: 3 }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            100% Completion (Green Strikethrough)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#FFD700', height: 3 }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            Partial Completion (Yellow Strikethrough)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendX}>❌</Text>
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            Streak Broken (Red X)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.text.secondary, height: 2 }]} />
          <Text style={[styles.legendText, { color: colors.text.primary }]}>
            No Activity (Grey Strikethrough)
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
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 40,
    position: 'relative',
    padding: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    zIndex: 2,
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 2,
    right: 2,
    transform: [{ translateY: -1.5 }],
    zIndex: 1,
  },
  brokenX: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 12,
    zIndex: 3,
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
  legendLine: {
    width: 20,
    borderRadius: 1,
    marginRight: 8,
  },
  legendX: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
});
