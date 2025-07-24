import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

const PRAYER_TIMES = {
  fajr: '05:30',
  dhuhr: '12:15',
  asr: '15:30',
  maghrib: '18:45',
  isha: '20:15',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const grid: { day: number; thisMonth: boolean; date: Date }[] = [];
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.push({
      day: daysInPrevMonth - i,
      thisMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push({
      day,
      thisMonth: true,
      date: new Date(year, month, day),
    });
  }
  // Next month days
  while (grid.length % 7 !== 0) {
    const nextDay = grid.length - (firstDay + daysInMonth) + 1;
    grid.push({
      day: nextDay,
      thisMonth: false,
      date: new Date(year, month + 1, nextDay),
    });
  }
  return grid;
}

export default function CalendarTab() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const colorScheme = useColorScheme() ?? 'light';

  const grid = useMemo(() => getCalendarGrid(currentYear, currentMonth), [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };
  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDayPress = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    Alert.alert(
      `Prayer times for ${dateStr}`,
      `Fajr: ${PRAYER_TIMES.fajr}\nDhuhr: ${PRAYER_TIMES.dhuhr}\nAsr: ${PRAYER_TIMES.asr}\nMaghrib: ${PRAYER_TIMES.maghrib}\nIsha: ${PRAYER_TIMES.isha}`
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Calendar Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
            <ThemedText style={styles.navIcon}>◀️</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.monthYear}>
            {MONTHS[currentMonth]} {currentYear}
          </ThemedText>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <ThemedText style={styles.navIcon}>▶️</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Calendar Grid */}
        <View style={styles.grid}>
          {WEEKDAYS.map((wd) => (
            <ThemedText key={wd} style={[styles.dayCell, styles.headerCell]}>{wd}</ThemedText>
          ))}
          {grid.map((cell, idx) => {
            const isToday =
              cell.thisMonth &&
              cell.date.getDate() === today.getDate() &&
              cell.date.getMonth() === today.getMonth() &&
              cell.date.getFullYear() === today.getFullYear();
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayCell, !cell.thisMonth && styles.otherMonthCell, isToday && styles.todayCell]}
                onPress={() => handleDayPress(cell.date)}
                disabled={!cell.thisMonth}
                activeOpacity={cell.thisMonth ? 0.7 : 1}
              >
                <ThemedText style={[styles.dayText, !cell.thisMonth && styles.otherMonthText, isToday && styles.todayText]}>{cell.day}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 24,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  headerCell: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  otherMonthCell: {
    backgroundColor: 'transparent',
  },
  otherMonthText: {
    color: '#bbb',
  },
  todayCell: {
    backgroundColor: '#10B981',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 16,
  },
}); 