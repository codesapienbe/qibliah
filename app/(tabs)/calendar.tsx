import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants and mock data
const PRAYER_NAMES = [
  { key: 'fajr', name: 'Fajr' },
  { key: 'sunrise', name: 'Sunrise' },
  { key: 'dhuhr', name: 'Dhuhr' },
  { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isha', name: 'Isha' },
];
// Update mock data type to allow string index
const MOCK_PRAYER_TIMES: Record<string, { [key: string]: string }> = {
  '2024-1-1': { fajr: '05:30', sunrise: '07:00', dhuhr: '12:30', asr: '15:45', maghrib: '18:15', isha: '20:45' },
  '2024-1-2': { fajr: '05:31', sunrise: '07:01', dhuhr: '12:31', asr: '15:46', maghrib: '18:16', isha: '20:46' },
  '2024-1-3': { fajr: '05:32', sunrise: '07:02', dhuhr: '12:32', asr: '15:47', maghrib: '18:17', isha: '20:47' },
};
const INITIAL_REMINDERS = [
  { id: 1, prayer: 'Fajr', time: '05:30', enabled: true },
  { id: 2, prayer: 'Dhuhr', time: '12:30', enabled: true },
  { id: 3, prayer: 'Asr', time: '15:45', enabled: true },
  { id: 4, prayer: 'Maghrib', time: '18:15', enabled: true },
  { id: 5, prayer: 'Isha', time: '20:45', enabled: true },
];
const LOCATION = {
  city: 'Zele, Belgium',
  coords: '51.0656°N, 4.0409°E',
};
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Add static mapping for Islamic months
const ISLAMIC_MONTHS = [
  'Muharram', 'Safar', 
   'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani',
  'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

// Utility functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
function getCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);
  return days;
}
function getNextPrayer(now: Date, times: Record<string, string>): { key: string; name: string; time: string } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const key of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    if (!times[key]) continue;
    const [h, m] = times[key].split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      return { key, name: PRAYER_NAMES.find(p => p.key === key)?.name || key, time: times[key] };
    }
  }
  // Next day's Fajr
  return { key: 'fajr', name: 'Fajr', time: times['fajr'] };
}
function getCountdown(now: Date, nextPrayerTime: string): { hours: number; minutes: number; seconds: number } {
  if (!nextPrayerTime) return { hours: 0, minutes: 0, seconds: 0 };
  const [h, m] = nextPrayerTime.split(':').map(Number);
  let next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}
function getIslamicMonthName(month: number) {
  // For demo, just map Gregorian month to Islamic month (not accurate)
  return ISLAMIC_MONTHS[month % 12];
}

export default function CalendarTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [now, setNow] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Update prayer times when selectedDate changes
  useEffect(() => {
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    setPrayerTimes(MOCK_PRAYER_TIMES[dateKey] || {});
  }, [selectedDate]);

  // Calendar navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDayClick = (day: number | null) => {
    if (day) {
      const newSelectedDate = new Date(year, month, day);
      setSelectedDate(newSelectedDate);
    }
  };

  const isToday = (day: number | null) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  const isSelected = (day: number | null) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Next prayer and countdown (only for today)
  const nextPrayer = useMemo(() => getNextPrayer(now, prayerTimes), [now, prayerTimes]);
  const countdown = useMemo(() => getCountdown(now, nextPrayer.time), [now, nextPrayer]);

  const handleToggleReminder = (id: number) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const todayStr = useMemo(() =>
    selectedDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }), [selectedDate]);

  // Gesture state
  const [dragX, setDragX] = useState(0);
  const SWIPE_THRESHOLD = 60;

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    setDragX(event.nativeEvent.translationX);
  };
  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === 5) { // 5 = END
      if (dragX < -SWIPE_THRESHOLD) {
        goToNextMonth();
      } else if (dragX > SWIPE_THRESHOLD) {
        goToPreviousMonth();
      }
      setDragX(0);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      {/* Qibla-style Title */}
      <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28 }}>Prayer Calendar</ThemedText>
      </View>
      {/* Month Info (no background) */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <ThemedText style={{ fontSize: 22, fontWeight: 'bold', color: Colors[colorScheme].primary }}>{getIslamicMonthName(month)} {year}</ThemedText>
        <ThemedText style={{ color: '#059669', fontSize: 14 }}>{MONTHS[month]} {year}</ThemedText>
        <TouchableOpacity
          onPress={goToToday}
          style={{ marginTop: 6, paddingVertical: 7, paddingHorizontal: 18, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12, alignItems: 'center' }}
        >
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: '600', fontSize: 16 }}>Today</ThemedText>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[colorScheme].background }}>
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0 }}>
          {/* Weekday Headers */}
          <View style={{ flexDirection: 'row', backgroundColor: '#d1fae5', paddingVertical: 10, borderRadius: 12, marginHorizontal: 16, marginBottom: 2 }}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={{ color: '#065f46', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}>{day}</ThemedText>
              </View>
            ))}
          </View>
          {/* Calendar Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 12, marginHorizontal: 8, backgroundColor: 'transparent', marginBottom: 8 }}>
            {calendarDays.map((day, index) => {
              const selected = isSelected(day);
              const todayCell = isToday(day);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDayClick(day)}
                  disabled={day === null}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    marginBottom: 2,
                    backgroundColor:
                      day === null ? 'transparent'
                      : selected ? '#059669'
                      : todayCell ? '#d1fae5'
                      : 'transparent',
                    shadowColor: selected ? '#059669' : undefined,
                    shadowOpacity: selected ? 0.2 : 0,
                    shadowRadius: selected ? 8 : 0,
                    elevation: selected ? 2 : 0,
                    borderWidth: todayCell && !selected ? 1 : 0,
                    borderColor: todayCell && !selected ? '#059669' : 'transparent',
                    transform: selected ? [{ scale: 1.08 }] : undefined,
                  }}
                  activeOpacity={day !== null ? 0.7 : 1}
                >
                  <ThemedText style={{
                    color: day === null ? 'transparent'
                      : selected ? '#fff'
                      : todayCell ? '#059669'
                      : '#374151',
                    fontWeight: selected || todayCell ? 'bold' : '500',
                    fontSize: 16,
                  }}>{day}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Prayer Times Section */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#a7f3d0', padding: 14, backgroundColor: '#d1fae5', marginHorizontal: 8, borderRadius: 18, marginTop: 0, shadowColor: '#10B981', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#065f46', marginBottom: 10, textAlign: 'center' }}>Prayer Times</ThemedText>
            {selectedDate ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {PRAYER_NAMES.map((prayer) => (
                  <View key={prayer.key} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', flexBasis: '30%', margin: 4, borderWidth: 1, borderColor: '#a7f3d0', shadowColor: '#10B981', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
                    <ThemedText style={{ color: '#059669', fontWeight: 'bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{prayer.name}</ThemedText>
                    <ThemedText style={{ color: '#065f46', fontWeight: 'bold', fontSize: 18 }}>{prayerTimes[prayer.key] || '--:--'}</ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={{ textAlign: 'center', color: '#059669', marginVertical: 12 }}>Select a date to view prayer times</ThemedText>
            )}
            {selectedDate && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <ThemedText style={{ color: '#059669', fontSize: 15 }}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  invisibleCell: {
    backgroundColor: 'transparent',
  },
  invisibleText: {
    color: 'transparent',
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
  selectedCell: {
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 4,
  },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  prayerCell: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  prayerName: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  prayerTime: {
    color: '#222',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  countdownItem: {
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'monospace',
  },
  countdownLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  countdownSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginHorizontal: 2,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reminderSeparator: {
    height: 1,
    backgroundColor: '#f3f3f3',
    marginVertical: 2,
  },
}); 