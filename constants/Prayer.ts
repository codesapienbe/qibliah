export type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export const PRAYER_KEYS: PrayerKey[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const NOTIFIABLE_PRAYER_KEYS: PrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// AlAdhan calculation method defaults
// 2 -> Muslim World League (MWL)
export const DEFAULT_CALC_METHOD = 2;
// 0 -> Shafi, Maliki, Hanbali; 1 -> Hanafi (for Asr)
export const DEFAULT_SCHOOL = 0;

export function prayerKeyToI18nKey(key: PrayerKey): string {
  return key.toLowerCase();
}
