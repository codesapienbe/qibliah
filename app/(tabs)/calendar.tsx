import { ThemedText } from '@/components/ThemedText';
import TimezoneSelection from '@/components/TimezoneSelection';
import { Colors } from '@/constants/Colors';
import { PrayerKey } from '@/constants/Prayer';
import { SupportedTimezone } from '@/constants/Timezones';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { playAdhan, stopAdhan } from '@/services/audio';
import { initNotifications } from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, SafeAreaView, ScrollView, Switch, TouchableOpacity, View } from 'react-native';

export default function CalendarTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const router = useRouter();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  // Single-line swipeable week strip (no month toggle)
  const {
    loading,
    error,
    rows,
    nextPrayerKey,
    nextPrayerTimeString,
    countdown,
    reminderEnabled,
    toggleReminder,
    isToday,
    permissionDenied,
    timezoneChosen,
    setTimezone,
    refresh,
    requestLocationPermission,
    getCurrentLocation,
    setManualLocation,
  } = usePrayerTimes(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dynamic scale based on screen height to fit content tighter on smaller devices
  const windowHeight = Dimensions.get('window').height;
  const SCALE = windowHeight < 720 ? 0.85 : windowHeight < 800 ? 0.9 : 1;
  const FS_HEADER = Math.round(22 * SCALE);
  const FS_WEEKDAY = Math.round(13 * SCALE);
  const FS_TODAY_BTN = Math.round(16 * SCALE);
  const PAD_TODAY_BTN_V = Math.round(7 * SCALE);
  const PAD_TODAY_BTN_H = Math.round(18 * SCALE);
  const RADIUS_TODAY_BTN = Math.round(12 * SCALE);
  const WEEK_HEADER_PAD_V = Math.round(10 * SCALE);
  const GRID_PADDING = Math.round(12 * SCALE);
  const GRID_MARGIN_BOTTOM = Math.round(8 * SCALE);
  const CELL_RADIUS = Math.round(10 * SCALE);
  const CELL_MARGIN_BOTTOM = Math.round(2 * SCALE);
  const DAY_FONT = Math.round(16 * SCALE);
  const LOADING_PAD_V = Math.round(8 * SCALE);
  const ERROR_PAD = Math.round(10 * SCALE);
  const COUNTDOWN_CONTAINER_MV = Math.round(16 * SCALE);
  const COUNTDOWN_TITLE_FS = Math.round(18 * SCALE);
  const COUNTDOWN_TIME_FS = Math.round(18 * SCALE);
  const COUNTDOWN_DIGIT_FS = Math.round(24 * SCALE);
  const COUNTDOWN_SEP_FS = Math.round(28 * SCALE);
  const SECTION_MARGIN_TOP = Math.round(8 * SCALE);
  const CARD_PADDING = Math.round(14 * SCALE);
  const CARD_RADIUS = Math.round(14 * SCALE);
  // Increase aspectRatio slightly (< height) to shrink calendar vertical footprint when scaling
  const CELL_ASPECT = SCALE < 1 ? 1 + (1 - SCALE) * 0.8 : 1;
  const PILL_WIDTH = Math.round(92 * SCALE);
  const PILL_HEIGHT = Math.round(36 * SCALE);
  const PILL_RADIUS = Math.round(10 * SCALE);
  const [showSetup, setShowSetup] = useState(false);

  const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  function getWeekStart(d: Date) {
    const base = new Date(d);
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    start.setDate(base.getDate() - base.getDay());
    return start;
  }
  const weekDates = useMemo(() => {
    const base = new Date(selectedDate);
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay()); // Sunday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);
  const prevWeek = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 7));
  const nextWeek = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 7));
  // Navigation helpers (not rendered yet)
  const goToToday = () => { setCurrentDate(today); setSelectedDate(today); };
  const handleWeekDateClick = (date: Date) => { setSelectedDate(date); setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1)); };
  
  // Hide selection controls for now
  // (selection UI removed)

  const ISLAMIC_MONTHS = [
    'muharram', 'safar', 'rabi_al_awwal', 'rabi_al_thani', 'jumada_al_awwal', 'jumada_al_thani',
    'rajab', 'shaban', 'ramadan', 'shawwal', 'dhu_al_qidah', 'dhu_al_hijjah'
  ];
  function getIslamicMonthName(month: number) {
    return t(ISLAMIC_MONTHS[month % 12]);
  }
  const weekStartSelected = useMemo(() => getWeekStart(selectedDate), [selectedDate]);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      // Ensure audio is stopped when leaving the screen
      stopAdhan().catch(() => {});
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const granted = await requestLocationPermission();
          if (granted && isActive) {
            await getCurrentLocation();
            setShowSetup(false);
          } else if (!granted && isActive) {
            setShowSetup(true);
          }
        } catch {}
        try { await initNotifications(); } catch {}
      })();
      return () => { isActive = false; };
    }, [requestLocationPermission, getCurrentLocation])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('CALENDAR_SOTD', () => {
      // Navigate to home and ask for Surah of the Day
      try { router.push('/(tabs)'); } catch {}
      DeviceEventEmitter.emit('HOME_SOTD');
    });
    return () => sub.remove();
  }, [router]);

  const handleToggleAdhan = async () => {
    if (isPlaying) {
      try {
        await stopAdhan();
      } catch {}
      setIsPlaying(false);
      return;
    }
    try {
      // Attempt to play bundled adhan audio if present (mp3 variants)
      let ok = await playAdhan({ localModule: require('../../assets/sounds/adhan01.mp3'), volume: 1.0, shouldLoop: false });
      if (!ok) {
        try { ok = await playAdhan({ localModule: require('../../assets/sounds/adhan02.mp3'), volume: 1.0, shouldLoop: false }); } catch {}
      }
      if (!ok) {
        try { ok = await playAdhan({ localModule: require('../../assets/sounds/adhan03.mp3'), volume: 1.0, shouldLoop: false }); } catch {}
      }
      if (!ok) {
        try { ok = await playAdhan({ localModule: require('../../assets/sounds/adhan04.mp3'), volume: 1.0, shouldLoop: false }); } catch {}
      }
      if (!ok) {
        // Fallback: try without explicit module (no-op if not configured)
        ok = await playAdhan();
      }
      if (ok) setIsPlaying(true);
    } catch {
      // ignore playback errors
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background, paddingTop: 24 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[colorScheme].background, paddingTop: 12 }}>
        {/* Calendar Header */}
        <View style={{ alignItems: 'center', marginBottom: Math.round(8 * SCALE) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={prevWeek}>
              <Ionicons name="chevron-back" size={Math.round(24 * SCALE)} color={Colors[colorScheme].primary} />
            </TouchableOpacity>
            <ThemedText style={{ fontSize: FS_HEADER, fontWeight: 'bold', color: Colors[colorScheme].primary }}>
              {t(MONTHS[selectedDate.getMonth()])} {selectedDate.getFullYear()} — {getIslamicMonthName(selectedDate.getMonth())}
            </ThemedText>
            <TouchableOpacity onPress={nextWeek}>
              <Ionicons name="chevron-forward" size={Math.round(24 * SCALE)} color={Colors[colorScheme].primary} />
            </TouchableOpacity>
          </View>
          {/* Removed selected date label */}
          <TouchableOpacity
            onPress={goToToday}
            style={{ marginTop: Math.round(6 * SCALE), paddingVertical: PAD_TODAY_BTN_V, paddingHorizontal: PAD_TODAY_BTN_H, backgroundColor: Colors[colorScheme].surface, borderRadius: RADIUS_TODAY_BTN, alignItems: 'center' }}
          >
            <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: '600', fontSize: FS_TODAY_BTN }}>{t('today')}</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Removed Week/Month toggle */}

        {/* Weekday Headers */}
        <View style={{ flexDirection: 'row', backgroundColor: Colors[colorScheme].surface, paddingVertical: WEEK_HEADER_PAD_V, borderRadius: 12, marginHorizontal: 16, marginBottom: Math.round(2 * SCALE) }}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: FS_WEEKDAY, letterSpacing: 1 }}>{t(day)}</ThemedText>
            </View>
          ))}
        </View>
        {/* Single-line swipeable week strip */}
        <View style={{ flexDirection: 'row', gap: Math.round(2 * SCALE), padding: GRID_PADDING, marginHorizontal: 8, backgroundColor: 'transparent', marginBottom: GRID_MARGIN_BOTTOM }}>
          {weekDates.map((date, index) => {
            const inCurrentMonth = date.getMonth() === month;
            const isTodayWeek = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
            const isSelectedWeek = date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === selectedDate.getMonth() && date.getDate() === selectedDate.getDate();
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleWeekDateClick(date)}
                style={{
                  flex: 1,
                  aspectRatio: CELL_ASPECT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: CELL_RADIUS,
                  backgroundColor: isSelectedWeek ? Colors[colorScheme].primary : isTodayWeek ? Colors[colorScheme].surface : 'transparent',
                  shadowColor: isSelectedWeek ? Colors[colorScheme].primary : undefined,
                  shadowOpacity: isSelectedWeek ? 0.2 : 0,
                  shadowRadius: isSelectedWeek ? 8 : 0,
                  elevation: isSelectedWeek ? 2 : 0,
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={{
                  color: isSelectedWeek ? Colors[colorScheme].background : inCurrentMonth ? Colors[colorScheme].text : '#bbb',
                  fontWeight: isSelectedWeek || isTodayWeek ? 'bold' : '500',
                  fontSize: DAY_FONT,
                }}>{date.getDate()}</ThemedText>
                {isSelectedWeek && (
                  <ThemedText style={{ position: 'absolute', bottom: Math.round(4 * SCALE), color: Colors[colorScheme].background, fontSize: Math.round(10 * SCALE) }}>
                    {t(MONTHS[date.getMonth()]).slice(0,3)}
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {loading && (
          <View style={{ paddingVertical: LOADING_PAD_V }}>
            <ActivityIndicator color={Colors[colorScheme].primary} />
          </View>
        )}
        {!!error && (
          <View style={{ marginHorizontal: 16, padding: ERROR_PAD, borderRadius: 8, backgroundColor: Colors[colorScheme].surface }}>
            <ThemedText style={{ color: Colors[colorScheme].error }}>{error}</ThemedText>
          </View>
        )}
        {/* Location/Timezone selection temporarily removed */}

        {/* Prayer Times Table */}
        <View style={{ marginHorizontal: 16, marginTop: SECTION_MARGIN_TOP, padding: CARD_PADDING, backgroundColor: Colors[colorScheme].surface, borderRadius: CARD_RADIUS }}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{t('todays_prayer_times')}</ThemedText>
          {rows.map((row) => (
            <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Math.round(6 * SCALE) }}>
              <ThemedText style={{ color: Colors[colorScheme].text }}>{t(row.key.toLowerCase(), { defaultValue: row.key })}</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(10 * SCALE) }}>
                {/* Time pill */}
                <View style={{ width: PILL_WIDTH, height: PILL_HEIGHT, borderRadius: PILL_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors[colorScheme].surface }}>
                  <ThemedText style={{ color: Colors[colorScheme].text, fontWeight: 'bold' }}>{row.time}</ThemedText>
                </View>
                {/* Switch pill */}
                <View style={{ width: PILL_WIDTH, height: PILL_HEIGHT, borderRadius: PILL_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors[colorScheme].surface, opacity: row.notifiable ? 1 : 0.5 }}>
                  <Switch
                    value={row.notifiable ? !!reminderEnabled[row.key as PrayerKey] : false}
                    onValueChange={row.notifiable ? ((newValue: boolean) => {
                      const key = row.key as PrayerKey;
                      const current = !!reminderEnabled[key];
                      if (newValue === current) return; // ignore no-op changes
                      toggleReminder(key);
                    }) : undefined}
                    disabled={!row.notifiable}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Next Prayer Countdown (moved below prayer times) */}
        {isToday && (
        <View style={{ alignItems: 'center', marginVertical: COUNTDOWN_CONTAINER_MV }}>
          {/* Keep space tight by removing title row */}
          <ThemedText style={{ color: Colors[colorScheme].secondary, fontWeight: 'bold', fontSize: COUNTDOWN_TITLE_FS }}>{nextPrayerKey ? t(nextPrayerKey.toLowerCase(), { defaultValue: nextPrayerKey }) : '—'}</ThemedText>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: COUNTDOWN_TIME_FS }}>{nextPrayerTimeString ?? '—'}</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ThemedText style={{ fontSize: COUNTDOWN_DIGIT_FS, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.hours).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: COUNTDOWN_SEP_FS, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: COUNTDOWN_DIGIT_FS, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.minutes).padStart(2, '0')}</ThemedText>
            <ThemedText style={{ fontSize: COUNTDOWN_SEP_FS, fontWeight: 'bold', color: Colors[colorScheme].secondary, marginHorizontal: 2 }}>:</ThemedText>
            <ThemedText style={{ fontSize: COUNTDOWN_DIGIT_FS, fontWeight: 'bold', color: Colors[colorScheme].text, fontFamily: 'monospace' }}>{String(countdown.seconds).padStart(2, '0')}</ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleToggleAdhan}
            style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors[colorScheme].primary }}
            activeOpacity={0.85}
          >
            <Ionicons name={isPlaying ? 'stop' : 'volume-high'} size={18} color={Colors[colorScheme].background} />
            <ThemedText style={{ marginLeft: 8, color: Colors[colorScheme].background, fontWeight: 'bold' }}>
              {isPlaying ? t('stop', { defaultValue: 'Stop' }) : t('play_adhan', { defaultValue: 'Play Adhan' })}
            </ThemedText>
          </TouchableOpacity>
        </View>
        )}
        {/* Removed Reminders and Stats sections for now */}
      </ScrollView>

      {(showSetup || permissionDenied || !timezoneChosen) && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ flex: 1 }}>
            <TimezoneSelection
              onTimezoneSelected={async (tz: SupportedTimezone, loc?: { lat: number; lng: number }) => {
                try {
                  await setTimezone(tz);
                  if (loc) {
                    setManualLocation(loc);
                  }
                  await refresh();
                } catch {}
                setShowSetup(false);
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
