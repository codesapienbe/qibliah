import { DEFAULT_CALC_METHOD, DEFAULT_SCHOOL, NOTIFIABLE_PRAYER_KEYS, PRAYER_KEYS, PrayerKey } from '@/constants/Prayer';
import axios from 'axios';

export type PrayerTimesMap = Record<PrayerKey, Date>;

export interface FetchPrayerTimesResult {
  times: PrayerTimesMap;
  timezone?: string;
}

function atLocalTimeOnDate(baseDate: Date, hhmm: string): Date {
  // Some APIs return strings like "05:30 (CEST)" or with seconds "05:30:12"
  const clean = hhmm.split(' ')[0];
  const parts = clean.split(':');
  const hours = Number(parts[0] || '0');
  const minutes = Number(parts[1] || '0');
  const seconds = Number(parts[2] || '0');
  const date = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    seconds,
    0,
  );
  return date;
}

export function formatTimeHHMM(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export async function fetchPrayerTimesFromApi(
  latitude: number,
  longitude: number,
  onDate: Date = new Date(),
  method: number = DEFAULT_CALC_METHOD,
  school: number = DEFAULT_SCHOOL,
  timezone?: string,
): Promise<FetchPrayerTimesResult> {
  const timestamp = Math.floor(onDate.getTime() / 1000);
  const tzParam = timezone ? `&timezonestring=${encodeURIComponent(timezone)}` : '';
  const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}${tzParam}`;
  const response = await axios.get(url);
  const data = response.data?.data;
  const timings = data?.timings || {};
  const detectedTimezone: string | undefined = data?.meta?.timezone;

  const times: Partial<PrayerTimesMap> = {};
  for (const key of PRAYER_KEYS) {
    const t = timings[key];
    if (typeof t === 'string') {
      times[key] = atLocalTimeOnDate(onDate, t);
    }
  }
  return { times: times as PrayerTimesMap, timezone: timezone || detectedTimezone };
}

export function findNextPrayer(
  times: PrayerTimesMap,
  now: Date = new Date(),
): { key: PrayerKey; time: Date } | null {
  const future = PRAYER_KEYS
    .map((k) => ({ key: k, time: times[k] }))
    .filter((pt) => pt.time.getTime() > now.getTime())
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (future.length > 0) {
    return future[0];
  }

  const fajrToday = times['Fajr'];
  const tomorrowFajr = new Date(fajrToday.getTime() + 24 * 60 * 60 * 1000);
  return { key: 'Fajr', time: tomorrowFajr };
}

export function computeCountdown(
  targetTime: Date,
  now: Date = new Date(),
): { hours: number; minutes: number; seconds: number; totalMs: number } {
  const totalMs = Math.max(0, targetTime.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs };
}

export function toDisplayRows(times: PrayerTimesMap): Array<{ key: PrayerKey; label: PrayerKey; time: string; notifiable: boolean }> {
  return PRAYER_KEYS.map((key) => ({
    key,
    label: key,
    time: formatTimeHHMM(times[key]),
    notifiable: NOTIFIABLE_PRAYER_KEYS.includes(key),
  }));
}

// New helper: determine effective prayer (among Fajr, Dhuhr, Asr, Maghrib, Isha) using a 30-minute proximity rule
export function determineEffectivePrayer(
  times: PrayerTimesMap,
  now: Date = new Date(),
  thresholdMinutes: number = 30,
): { key: PrayerKey; refTime: Date } {
  // Only consider the five daily obligatory prayers (exclude Sunrise)
  const keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

  // Find next prayer among the five
  const upcoming = (keys
    .map((k) => ({ key: k as PrayerKey, time: times[k as PrayerKey] }))
    .filter((pt) => pt.time.getTime() > now.getTime())
    .sort((a, b) => a.time.getTime() - b.time.getTime()))[0];

  // If none in future today, next is tomorrow Fajr
  const nextEntry = upcoming || { key: 'Fajr' as PrayerKey, time: new Date(times['Fajr'].getTime() + 24 * 60 * 60 * 1000) };

  // Find previous prayer among the five within today
  const past = keys
    .map((k) => ({ key: k as PrayerKey, time: times[k as PrayerKey] }))
    .filter((pt) => pt.time.getTime() <= now.getTime())
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  // If none in past today (i.e., before Fajr), use yesterday's Isha approximation (Isha today minus 24h)
  const previousEntry = past[0] || { key: 'Isha' as PrayerKey, time: new Date(times['Isha'].getTime() - 24 * 60 * 60 * 1000) };

  const msToNext = nextEntry.time.getTime() - now.getTime();
  const msSincePrev = now.getTime() - previousEntry.time.getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;

  if (msToNext <= thresholdMs) {
    return { key: nextEntry.key, refTime: nextEntry.time };
  }
  return { key: previousEntry.key, refTime: previousEntry.time };
}
