import { MOCK_LOCATIONS } from '@/constants/MockLocations';
import { NOTIFIABLE_PRAYER_KEYS, PrayerKey } from '@/constants/Prayer';
import { DEFAULT_TIMEZONE, SUPPORTED_TIMEZONES, SupportedTimezone } from '@/constants/Timezones';
import { useLocation } from '@/hooks/useLocation';
import { cancelPrayerNotifications, initNotifications, schedulePrayerNotifications } from '@/services/notifications';
import { computeCountdown, fetchPrayerTimesFromApi, findNextPrayer, formatTimeHHMM, PrayerTimesMap, toDisplayRows } from '@/utils/prayerTimes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_REMINDER_MAP_KEY = '@prayer_reminders_enabled_map_v2';
const STORAGE_TIMEZONE_KEY = '@prayer_selected_timezone_v1';
const STORAGE_SCHEDULED_FOR_KEY = '@prayer_notifications_scheduled_for_v1';

type ReminderEnabledMap = Partial<Record<PrayerKey, boolean>>;

const defaultReminderMap: ReminderEnabledMap = NOTIFIABLE_PRAYER_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as ReminderEnabledMap);

export function usePrayerTimes(selectedDate?: Date) {
  const { location, requestPermission, getCurrentLocation, permissionDenied, setManualLocation } = useLocation();
  const [times, setTimes] = useState<PrayerTimesMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<ReminderEnabledMap>(defaultReminderMap);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState<SupportedTimezone>(DEFAULT_TIMEZONE);
  const [timezoneChosen, setTimezoneChosen] = useState<boolean>(false);
  const baseDate = useMemo(() => selectedDate ?? new Date(), [selectedDate]);
  const isToday = useMemo(() => {
    const d = baseDate;
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }, [baseDate]);
  const dateKey = useMemo(() => {
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [baseDate]);

  // Load reminder prefs and timezone
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(`${STORAGE_REMINDER_MAP_KEY}:${dateKey}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setReminderEnabled({ ...defaultReminderMap, ...parsed });
        } else {
          // default when no explicit setting for the date
          setReminderEnabled(defaultReminderMap);
        }
      } catch {}
      try {
        const tz = await AsyncStorage.getItem(STORAGE_TIMEZONE_KEY);
        if (tz && SUPPORTED_TIMEZONES.includes(tz as SupportedTimezone)) {
          setSelectedTimezone(tz as SupportedTimezone);
          setTimezoneChosen(true);
        }
      } catch {}
    })();
  }, [dateKey]);

  // Ask for permission and fetch location on mount if not available
  useEffect(() => {
    (async () => {
      try {
        const granted = await requestPermission();
        if (granted) {
          await getCurrentLocation();
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to get location');
      }
    })();
  }, [requestPermission, getCurrentLocation]);

  const fetchTimes = useCallback(async () => {
    // Use manual location if permission denied (handled in useLocation)
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const { times } = await fetchPrayerTimesFromApi(location.lat, location.lng, baseDate, undefined, undefined, selectedTimezone);
      setTimes(times);
      // Schedule notifications only if viewing today's times
      if (isToday) {
        try {
          const scheduledFor = await AsyncStorage.getItem(STORAGE_SCHEDULED_FOR_KEY);
          if (scheduledFor !== dateKey) {
            await initNotifications();
            await cancelPrayerNotifications();
            const scheduleList = Object.entries(times)
              .filter(([k]) => NOTIFIABLE_PRAYER_KEYS.includes(k as PrayerKey))
              .map(([k, d]) => ({ key: k as PrayerKey, date: d }));
            await schedulePrayerNotifications(scheduleList, reminderEnabled);
            await AsyncStorage.setItem(STORAGE_SCHEDULED_FOR_KEY, dateKey);
          }
        } catch {
          // ignore scheduling errors
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch prayer times');
    } finally {
      setLoading(false);
    }
  }, [location, reminderEnabled, selectedTimezone, baseDate, isToday, dateKey]);

  // Fetch times when location or timezone changes
  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  // Refresh at midnight
  useEffect(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const now = new Date();
    const millisUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    refreshTimerRef.current = setTimeout(() => {
      fetchTimes();
    }, millisUntilMidnight + 1000);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [times, fetchTimes]);

  // Ticker for countdown
  useEffect(() => {
    if (countdownTickerRef.current) clearInterval(countdownTickerRef.current as any);
    countdownTickerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (countdownTickerRef.current) clearInterval(countdownTickerRef.current as any);
    };
  }, []);

  const next = useMemo(() => {
    if (!times || !isToday) return null;
    return findNextPrayer(times, now);
  }, [times, now, isToday]);

  const countdown = useMemo(() => {
    if (!next) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    return computeCountdown(next.time, now);
  }, [next, now]);

  const rows = useMemo(() => (times ? toDisplayRows(times) : []), [times]);

  const toggleReminder = useCallback(async (key: PrayerKey) => {
    const nextMap = { ...reminderEnabled, [key]: !reminderEnabled[key] };
    setReminderEnabled(nextMap);
    try {
      await AsyncStorage.setItem(`${STORAGE_REMINDER_MAP_KEY}:${dateKey}`, JSON.stringify(nextMap));
      if (times && isToday) {
        await cancelPrayerNotifications();
        const scheduleList = Object.entries(times)
          .filter(([k]) => NOTIFIABLE_PRAYER_KEYS.includes(k as PrayerKey))
          .map(([k, d]) => ({ key: k as PrayerKey, date: d }));
        await schedulePrayerNotifications(scheduleList, nextMap);
      }
    } catch {
      // ignore
    }
  }, [reminderEnabled, times, isToday, dateKey]);

  const setTimezone = useCallback(async (tz: SupportedTimezone) => {
    setSelectedTimezone(tz);
    setTimezoneChosen(true);
    try {
      await AsyncStorage.setItem(STORAGE_TIMEZONE_KEY, tz);
    } catch {}
  }, []);

  const selectMockLocation = useCallback(async (locId: string) => {
    const loc = MOCK_LOCATIONS.find((l) => l.id === locId);
    if (!loc) return;
    setManualLocation({ lat: loc.lat, lng: loc.lng });
    await setTimezone(loc.timezone);
    await fetchTimes();
  }, [setManualLocation, setTimezone, fetchTimes]);

  return {
    loading,
    error,
    permissionDenied,
    rows,
    nextPrayerKey: next?.key ?? null,
    nextPrayerTime: next?.time ?? null,
    nextPrayerTimeString: next?.time ? formatTimeHHMM(next.time) : null,
    countdown,
    reminderEnabled,
    toggleReminder,
    refresh: fetchTimes,
    // manual selection support
    supportedTimezones: SUPPORTED_TIMEZONES,
    timezone: selectedTimezone,
    timezoneChosen,
    setTimezone,
    mockLocations: MOCK_LOCATIONS,
    selectMockLocation,
    isToday,
  };
}
