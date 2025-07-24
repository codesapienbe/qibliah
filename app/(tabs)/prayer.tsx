import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrayerTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Placeholder state
  const [nextPrayer] = useState({ name: t('fajr'), time: '05:30' });
  const [countdown] = useState({ hours: 2, minutes: 15, seconds: 10 });
  const [reminders] = useState([
    { id: 1, prayer: t('fajr'), time: '05:30', enabled: true },
    { id: 2, prayer: t('dhuhr'), time: '12:30', enabled: true },
    { id: 3, prayer: t('asr'), time: '15:45', enabled: true },
    { id: 4, prayer: t('maghrib'), time: '18:15', enabled: true },
    { id: 5, prayer: t('isha'), time: '20:45', enabled: true },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28 }}>{t('prayer_times')}</ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[colorScheme].background }}>
        {/* Next Prayer Countdown */}
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <ThemedText style={{ color: Colors[colorScheme].info, marginBottom: 4 }}>{t('next_prayer')}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayer.name}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayer.time}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.hours).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.minutes).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.seconds).padStart(2, '0')}</ThemedText>
          </View>
        </View>
        {/* Prayer Times Table (placeholder) */}
        <View style={{ marginHorizontal: 16, marginTop: 8, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('todays_prayer_times')}</ThemedText>
          {/* ...prayer times grid/table here... */}
        </View>
        {/* Reminders (placeholder) */}
        <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('reminders')}</ThemedText>
          {/* ...reminders toggle list here... */}
        </View>
        {/* Stats (placeholder) */}
        <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('stats')}</ThemedText>
          {/* ...stats here... */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 