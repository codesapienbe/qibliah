export const SUPPORTED_TIMEZONES = [
  'Europe/Brussels',
  'Europe/Istanbul',
  'Europe/London',
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

export const DEFAULT_TIMEZONE: SupportedTimezone = 'Europe/Brussels';
