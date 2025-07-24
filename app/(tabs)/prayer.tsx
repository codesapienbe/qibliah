import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Switch, View } from 'react-native';

const PRAYER_TIMES = [
  { key: 'fajr', name: 'Fajr', time: '05:30' },
  { key: 'sunrise', name: 'Sunrise', time: '07:45' },
  { key: 'dhuhr', name: 'Dhuhr', time: '12:15' },
  { key: 'asr', name: 'Asr', time: '15:30' },
  { key: 'maghrib', name: 'Maghrib', time: '18:45' },
  { key: 'isha', name: 'Isha', time: '20:15' },
];

const INITIAL_REMINDERS = [
  { id: 1, prayer: 'Fajr', time: '05:30', enabled: true },
  { id: 2, prayer: 'Dhuhr', time: '12:15', enabled: true },
  { id: 3, prayer: 'Asr', time: '15:30', enabled: true },
  { id: 4, prayer: 'Maghrib', time: '18:45', enabled: true },
  { id: 5, prayer: 'Isha', time: '20:15', enabled: true },
];

const LOCATION = {
  city: 'Zele, Belgium',
  coords: '51.0656°N, 4.0409°E',
};

function getNextPrayer(now: Date, prayers: typeof PRAYER_TIMES): typeof PRAYER_TIMES[number] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < prayers.length; i++) {
    const [h, m] = prayers[i].time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      return prayers[i];
    }
  }
  return prayers[0]; // Next day's Fajr
}

function getCountdown(now: Date, nextPrayerTime: string): { hours: number; minutes: number; seconds: number } {
  const [h, m] = nextPrayerTime.split(':').map(Number);
  let next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

export default function PrayerTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [now, setNow] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextPrayer = useMemo(() => getNextPrayer(now, PRAYER_TIMES), [now]);
  const countdown = useMemo(() => getCountdown(now, nextPrayer.time), [now, nextPrayer]);

  const handleToggleReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const todayStr = useMemo(() =>
    now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }), [now]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Location Card */}
        <ThemedView style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ThemedText style={styles.icon}>📍</ThemedText>
            <View>
              <ThemedText type="subtitle">{LOCATION.city}</ThemedText>
              <ThemedText style={{ color: Colors[colorScheme].info, fontSize: 14 }}>{LOCATION.coords}</ThemedText>
            </View>
          </View>
          <ThemedText style={{ color: Colors[colorScheme].info, fontWeight: '500' }}>{todayStr}</ThemedText>
        </ThemedView>

        {/* Next Prayer Countdown */}
        <ThemedView style={[styles.card, { alignItems: 'center', marginBottom: 16 }]}> 
          <ThemedText type="subtitle" style={{ color: Colors[colorScheme].info, marginBottom: 4 }}>Next Prayer</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayer.name}</ThemedText>
            <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayer.time}</ThemedText>
          </View>
          <View style={styles.countdownRow}>
            <View style={styles.countdownItem}>
              <ThemedText style={styles.countdownValue}>{String(countdown.hours).padStart(2, '0')}</ThemedText>
              <ThemedText style={styles.countdownLabel}>HOURS</ThemedText>
            </View>
            <ThemedText style={styles.countdownSeparator}>:</ThemedText>
            <View style={styles.countdownItem}>
              <ThemedText style={styles.countdownValue}>{String(countdown.minutes).padStart(2, '0')}</ThemedText>
              <ThemedText style={styles.countdownLabel}>MINUTES</ThemedText>
            </View>
            <ThemedText style={styles.countdownSeparator}>:</ThemedText>
            <View style={styles.countdownItem}>
              <ThemedText style={styles.countdownValue}>{String(countdown.seconds).padStart(2, '0')}</ThemedText>
              <ThemedText style={styles.countdownLabel}>SECONDS</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Prayer Times Grid */}
        <View style={styles.grid}>
          {PRAYER_TIMES.map((prayer) => {
            const isNext = prayer.key === nextPrayer.key;
            return (
              <ThemedView
                key={prayer.key}
                style={[styles.prayerCard, isNext && styles.nextPrayerCard, { borderColor: isNext ? Colors[colorScheme].secondary : Colors[colorScheme].cardBorder }]}
              >
                <ThemedText style={[styles.prayerName, isNext && { color: '#fff' }]}>{prayer.name}</ThemedText>
                <ThemedText style={[styles.prayerTime, isNext && { color: '#fff' }]}>{prayer.time}</ThemedText>
                {isNext && (
                  <ThemedText style={styles.nextIndicator}>Next Prayer</ThemedText>
                )}
              </ThemedView>
            );
          })}
        </View>

        {/* Prayer Reminders */}
        <ThemedView style={[styles.card, { marginTop: 16 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ThemedText style={styles.icon}>🔔</ThemedText>
            <ThemedText type="subtitle">Prayer Reminders</ThemedText>
          </View>
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.reminderRow}>
                <ThemedText>{item.prayer} - {item.time}</ThemedText>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleReminder(item.id)}
                  thumbColor={item.enabled ? Colors[colorScheme].primary : Colors[colorScheme].cardBorder}
                  trackColor={{ true: Colors[colorScheme].primary, false: Colors[colorScheme].cardBorder }}
                />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.reminderSeparator} />}
          />
        </ThemedView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  prayerCard: {
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
  nextPrayerCard: {
    backgroundColor: '#10B981',
    borderColor: '#F59E0B',
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
  nextIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: '600',
    overflow: 'hidden',
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