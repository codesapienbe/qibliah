import { SupportedTimezone } from '@/constants/Timezones';

export interface MockLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  timezone: SupportedTimezone;
}

export const MOCK_LOCATIONS: MockLocation[] = [
  {
    id: 'zele-be',
    label: 'Zele, East Flanders, Belgium',
    address: 'Langestraat 54, 9240 Zele, East Flanders, Belgium',
    lat: 51.066,
    lng: 4.067,
    timezone: 'Europe/Brussels',
  },
  {
    id: 'lahulpe-be',
    label: 'La Hulpe, Belgium',
    address: 'La Hulpe, Walloon Brabant, Belgium',
    lat: 50.733,
    lng: 4.473,
    timezone: 'Europe/Brussels',
  },
  {
    id: 'istanbul-tr',
    label: 'Istanbul, Turkey (Beykent University, Ayazağa)',
    address: 'Beykent University, Ayazağa, İstanbul, Türkiye',
    lat: 41.105,
    lng: 29.020,
    timezone: 'Europe/Istanbul',
  },
  {
    id: 'bursa-tr',
    label: 'Bursa, Turkey',
    address: 'Osmangazi, Bursa, Türkiye',
    lat: 40.195,
    lng: 29.060,
    timezone: 'Europe/Istanbul',
  },
  {
    id: 'london-uk',
    label: 'London, United Kingdom',
    address: 'London, United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    timezone: 'Europe/London',
  },
];
