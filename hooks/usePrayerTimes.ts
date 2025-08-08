import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '@/hooks/useLocation';
import { computeCountdown, fetchPrayerTimesFromApi, findNextPrayer, formatTimeHHMM, PrayerTimesMap, toDisplayRows } from '@/utils/prayerTimes';
import { NOTIFIABLE_PRAYER_KEYS, PrayerKey } from '@/constants/Prayer';
import { cancelPrayerNotifications, initNotifications, schedulePrayerNotifications } from '@/services/notifications';
import { DEFAULT_TIMEZONE, SUPPORTED_TIMEZONES, SupportedTimezone } from '@/constants/Timezones';
import { MOCK_LOCATIONS, MockLocation } from '@/constants/MockLocations';

const STORAGE_REMINDER_MAP_KEY = '@prayer_reminders_enabled_map_v1';
const STORAGE_TIMEZONE_KEY = '@prayer_selected_timezone_v1';

type ReminderEnabledMap = Partial<Record<PrayerKey, boolean>>;

const defaultReminderMap: ReminderEnabledMap = NOTIFIABLE_PRAYER_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as ReminderEnabledMap);

export function usePrayerTimes() {
  const { location, requestPermission, getCurrentLocation, permissionDenied, setManualLocation } = useLocation();
  const [times, setTimes] = useState<PrayerTimesMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<ReminderEnabledMap>(defaultReminderMap);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [selectedTimezone, setSelectedTimezone] = useState<SupportedTimezone>(DEFAULT_TIMEZONE);

  // Load reminder prefs and timezone
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_REMINDER_MAP_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setReminderEnabled({ ...defaultReminderMap, ...parsed });
        }
      } catch {}
      try {
        const tz = await AsyncStorage.getItem(STORAGE_TIMEZONE_KEY);
        if (tz && SUPPORTED_TIMEZONES.includes(tz as SupportedTimezone)) {
          setSelectedTimezone(tz as SupportedTimezone);
        }
      } catch {}
    })();
  }, []);

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
      const { times } = await fetchPrayerTimesFromApi(location.lat, location.lng, new Date(), undefined, undefined, selectedTimezone);
      setTimes(times);
      // Schedule notifications for remaining prayers today
      try {
        await initNotifications();
        await cancelPrayerNotifications();
        const scheduleList = Object.entries(times)
          .filter(([k]) => NOTIFIABLE_PRAYER_KEYS.includes(k as PrayerKey))
          .map(([k, d]) => ({ key: k as PrayerKey, date: d }));
        await schedulePrayerNotifications(scheduleList, reminderEnabled);
      } catch {
        // ignore scheduling errors
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch prayer times');
    } finally {
      setLoading(false);
    }
  }, [location, reminderEnabled, selectedTimezone]);

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
    if (!times) return null;
    return findNextPrayer(times, now);
  }, [times, now]);

  const countdown = useMemo(() => {
    if (!next) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    return computeCountdown(next.time, now);
  }, [next, now]);

  const rows = useMemo(() => (times ? toDisplayRows(times) : []), [times]);

  const toggleReminder = useCallback(async (key: PrayerKey) => {
    const nextMap = { ...reminderEnabled, [key]: !reminderEnabled[key] };
    setReminderEnabled(nextMap);
    try {
      await AsyncStorage.setItem(STORAGE_REMINDER_MAP_KEY, JSON.stringify(nextMap));
      if (times) {
        await cancelPrayerNotifications();
        const scheduleList = Object.entries(times)
          .filter(([k]) => NOTIFIABLE_PRAYER_KEYS.includes(k as PrayerKey))
          .map(([k, d]) => ({ key: k as PrayerKey, date: d }));
        await schedulePrayerNotifications(scheduleList, nextMap);
      }
    } catch {
      // ignore
    }
  }, [reminderEnabled, times]);

  const setTimezone = useCallback(async (tz: SupportedTimezone) => {
    setSelectedTimezone(tz);
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
    setTimezone,
    mockLocations: MOCK_LOCATIONS,
    selectMockLocation,
  };
}
