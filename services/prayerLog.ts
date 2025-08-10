import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@prayer_learning_log_jsonl_v1';

export type PrayerLogEvent = {
  timestamp: string;
  type:
    | 'start'
    | 'stop'
    | 'next_step'
    | 'repeat_step'
    | 'finalization_step'
    | 'voice_command'
    | 'tap_advance'
    | 'auto_pose_advance'
    | 'pose_reading'
    | 'config';
  payload?: Record<string, any>;
};

export async function ensureLogFile(): Promise<void> {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing == null) {
    await AsyncStorage.setItem(STORAGE_KEY, '');
  }
}

export async function appendPrayerEvent(event: PrayerLogEvent): Promise<void> {
  await ensureLogFile();
  const prev = (await AsyncStorage.getItem(STORAGE_KEY)) || '';
  const line = JSON.stringify(event) + '\n';
  await AsyncStorage.setItem(STORAGE_KEY, prev + line);
}

export async function readAllPrayerEvents(): Promise<PrayerLogEvent[]> {
  const content = (await AsyncStorage.getItem(STORAGE_KEY)) || '';
  if (!content) return [];
  const lines = content.split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

export async function clearPrayerEvents(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '');
  } catch {}
}

export function getLogFilePath(): string {
  return 'asyncstorage://' + STORAGE_KEY;
}
