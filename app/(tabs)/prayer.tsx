import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { PrayerKey } from '@/constants/Prayer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrayerTab() {
  const colorScheme = useColorScheme() ?? 'light';
  useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    loading,
    error,
    permissionDenied,
    timezoneChosen,
    rows,
    nextPrayerKey,
    nextPrayerTimeString,
    countdown,
    reminderEnabled,
    toggleReminder,
    supportedTimezones,
    timezone,
    setTimezone,
    mockLocations,
    selectMockLocation,
  } = usePrayerTimes();

  const [showSelection, setShowSelection] = useState<boolean>(false);
  
  // Only show selection if permission is denied AND no timezone is chosen
  useEffect(() => {
    setShowSelection(permissionDenied && !timezoneChosen);
  }, [permissionDenied, timezoneChosen]);

  const FailsafePanel = () => (
    <View style={{ marginHorizontal: 16, marginTop: 8, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
      <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>{t('qibla_location_permission_info')}</ThemedText>
      <ThemedText style={{ color: Colors[colorScheme].text, marginBottom: 8 }}>{t('masjids_enter_location')}</ThemedText>

      <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', marginBottom: 6 }}>{t('select_timezone', { defaultValue: 'Select Timezone' })}</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {supportedTimezones.map((tz) => (
          <Pressable
            key={tz}
            onPress={() => { setTimezone(tz); setShowSelection(false); }}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: timezone === tz ? Colors[colorScheme].primary : Colors[colorScheme].surface, borderWidth: 1, borderColor: Colors[colorScheme].cardBorder }}
          >
            <ThemedText style={{ color: timezone === tz ? Colors[colorScheme].background : Colors[colorScheme].text }}>{tz}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', marginBottom: 6 }}>{t('select_location', { defaultValue: 'Select Location' })}</ThemedText>
      <View style={{ gap: 8 }}>
        {mockLocations.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => { selectMockLocation(loc.id); setShowSelection(false); }}
            style={{ padding: 10, borderRadius: 8, backgroundColor: Colors[colorScheme].surface, borderWidth: 1, borderColor: Colors[colorScheme].cardBorder }}
          >
            <ThemedText style={{ color: Colors[colorScheme].text, fontWeight: 'bold' }}>{loc.label}</ThemedText>
            <ThemedText style={{ color: Colors[colorScheme].info }}>{loc.address}</ThemedText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setShowSelection(false)} style={{ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors[colorScheme].cardBorder }}>
        <ThemedText style={{ color: Colors[colorScheme].text }}>{t('close', { defaultValue: 'Close' })}</ThemedText>
      </Pressable>
    </View>
  );

  const shouldShowFailsafe = showSelection;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[colorScheme].background }}>
        {loading && (
          <View style={{ paddingVertical: 8 }}>
            <ActivityIndicator color={Colors[colorScheme].primary} />
          </View>
        )}
        {!!error && (
          <View style={{ marginHorizontal: 16, padding: 10, borderRadius: 8, backgroundColor: Colors[colorScheme].surface }}>
            <ThemedText style={{ color: Colors[colorScheme].error }}>{error}</ThemedText>
          </View>
        )}

        {shouldShowFailsafe && <FailsafePanel />}

        {/* Next Prayer Countdown */}
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <ThemedText style={{ color: Colors[colorScheme].info, marginBottom: 4 }}>{t('next_prayer')}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayerKey ? t(nextPrayerKey.toLowerCase(), { defaultValue: nextPrayerKey }) : '—'}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 18 }}>{nextPrayerTimeString ?? '—'}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.hours).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.minutes).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.seconds).padStart(2, '0')}</ThemedText>
          </View>
        </View>
        {/* Prayer Times Table */}
        <View style={{ marginHorizontal: 16, marginTop: 8, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('todays_prayer_times')}</ThemedText>
          {rows.map((row) => (
            <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
              <ThemedText style={{ color: Colors[colorScheme].text }}>{t(row.key.toLowerCase(), { defaultValue: row.key })}</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ThemedText style={{ color: Colors[colorScheme].text, fontWeight: 'bold' }}>{row.time}</ThemedText>
                {row.notifiable && (
                  <Switch
                    value={!!reminderEnabled[row.key as PrayerKey]}
                    onValueChange={() => toggleReminder(row.key as PrayerKey)}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
        {/* Reminders */}
        <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: Colors[colorScheme].surface, borderRadius: 14 }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{t('reminders')}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].text, marginBottom: 8 }}>{t('toggle_reminders_info', { defaultValue: 'Enable or disable reminders per prayer above.' })}</ThemedText>
          
          {/* Only show the change location/timezone button if timezone is not chosen or permission is denied */}
          {(!timezoneChosen || permissionDenied) && (
            <Pressable
              onPress={() => setShowSelection(true)}
              style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors[colorScheme].surface, borderRadius: 8, borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, marginBottom: 8 }}
            >
              <ThemedText style={{ color: Colors[colorScheme].text }}>{t('change_location_timezone', { defaultValue: 'Change Location / Timezone' })}</ThemedText>
            </Pressable>
          )}
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