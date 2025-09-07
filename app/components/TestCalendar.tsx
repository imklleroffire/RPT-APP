import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';

export function TestCalendar() {
  const { colors } = useTheme();

  // Simple marked dates for testing
  const markedDates = {
    '2025-01-15': { marked: true, dotColor: colors.success },
    '2025-01-16': { marked: true, dotColor: colors.error },
    '2025-01-17': { marked: true, dotColor: colors.text.secondary },
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Test Calendar
      </Text>
      <Calendar
        markedDates={markedDates}
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
        onDayPress={(day) => {
          console.log('Test calendar day pressed:', day);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
