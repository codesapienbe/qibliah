import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

let Notifications: any | null = null;
let notificationsReady = false;

const STORAGE_SCHEDULED_IDS_KEY = '@prayer_notifications_scheduled_ids_v1';

async function readScheduledIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_SCHEDULED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeScheduledIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_SCHEDULED_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

async function clearScheduledIds(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_SCHEDULED_IDS_KEY);
  } catch {
    // ignore
  }
}

export async function initNotifications(): Promise<boolean> {
  try {
    // Dynamically import to avoid hard dependency during development
    const mod = await import('expo-notifications');
    Notifications = mod;

    // Set default handler to show alerts when foregrounded
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }

    // Request permissions (mainly for iOS)
    const permissions = await Notifications.getPermissionsAsync();
    let finalStatus = permissions.status;
    if (permissions.status !== 'granted') {
      const newPermissions = await Notifications.requestPermissionsAsync();
      finalStatus = newPermissions.status;
    }

    // Android channel setup (best-effort)
    try {
      if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
    } catch {
      // ignore channel errors
    }

    notificationsReady = finalStatus === 'granted';
    return notificationsReady;
  } catch {
    Notifications = null;
    notificationsReady = false;
    return false;
  }
}

export async function sendErrorNotification(
  errorCode: string,
  context?: string,
  message?: string,
): Promise<void> {
  const title = `An error occurred (${errorCode})`;
  const body = context || message || 'Please report this code to support.';

  // Try native notification first
  try {
    if (Notifications) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { errorCode, context }, sound: true },
        trigger: null,
      });
      return;
    }
  } catch {
    // fall through to Alert
  }

  // Fallback to Alert if notifications not available
  try {
    Alert.alert(title, body);
  } catch {
    // last resort: no-op
  }
}

type ScheduleItem = { key: string; date: Date };

export async function schedulePrayerNotifications(
  items: ScheduleItem[],
  enabledMap: Record<string, boolean | undefined>,
): Promise<void> {
  if (!Notifications) {
    const ok = await initNotifications();
    if (!ok || !Notifications) return;
  }

  const now = Date.now();
  const scheduledIds: string[] = await readScheduledIds();

  for (const item of items) {
    if (!enabledMap[item.key]) continue;
    const when = item.date.getTime();
    if (when <= now) continue;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Prayer time: ${item.key}`,
          body: item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: { prayer: item.key },
          sound: true,
        },
        trigger: { date: item.date },
      });
      scheduledIds.push(id);
    } catch {
      // ignore individual schedule errors
    }
  }

  await writeScheduledIds(scheduledIds);
}

export async function cancelPrayerNotifications(): Promise<void> {
  if (!Notifications) {
    await initNotifications();
  }
  try {
    const ids = await readScheduledIds();
    for (const id of ids) {
      try {
        await Notifications?.cancelScheduledNotificationAsync?.(id);
      } catch {
        // ignore
      }
    }
    await clearScheduledIds();
  } catch {
    // ignore
  }
}
