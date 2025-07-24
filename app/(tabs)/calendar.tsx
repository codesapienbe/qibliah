import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// Add static mapping for Islamic months
const ISLAMIC_MONTHS = [
  'muharram', 'safar', 
   'rabi_al_awwal', 'rabi_al_thani', 'jumada_al_awwal', 'jumada_al_thani',
  'rajab', 'shaban', 'ramadan', 'shawwal', 'dhu_al_qidah', 'dhu_al_hijjah'
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
function getIslamicMonthName(month: number, t: any) {
  return t(ISLAMIC_MONTHS[month % 12]);
}

export default function CalendarTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28 }}>{t('calendar')}</ThemedText>
      </View>
      {/* Month Info (no background) */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <ThemedText style={{ fontSize: 22, fontWeight: 'bold', color: Colors[colorScheme].primary }}>{getIslamicMonthName(month, t)} {year}</ThemedText>
        <ThemedText style={{ color: '#059669', fontSize: 14 }}>{t(MONTHS[month])} {year}</ThemedText>
        <TouchableOpacity
          onPress={goToToday}
          style={{ marginTop: 6, paddingVertical: 7, paddingHorizontal: 18, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12, alignItems: 'center' }}
        >
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: '600', fontSize: 16 }}>{t('today')}</ThemedText>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[colorScheme].background }}>
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 0 }}>
          {/* Weekday Headers */}
          <View style={{ flexDirection: 'row', backgroundColor: '#d1fae5', paddingVertical: 10, borderRadius: 12, marginHorizontal: 16, marginBottom: 2 }}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={{ color: '#065f46', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}>{t(day)}</ThemedText>
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
          {/* Word of the Day */}
          <View style={{ marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: '#f3f4f6', borderRadius: 14, alignItems: 'center' }}>
            <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('word_of_the_day')}</ThemedText>
            <ThemedText style={{ color: '#374151', fontSize: 15, textAlign: 'center' }} numberOfLines={3}>
              {t('word_of_the_day_quote')}
            </ThemedText>
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