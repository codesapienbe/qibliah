import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

let Notifications: any | null = null;
let notificationsReady = false;

// Custom notification sound configuration (e.g., 'adhan.wav')
let customSoundFileName: string | null = null; // include extension, e.g., 'adhan.wav' on Android, 'adhan.caf' on iOS
let customSoundChannelId = 'default'; // Android channel id to use when custom sound is configured
let foregroundPlaybackEnabled = false; // if true, attempt to play adhan when receiving notification in foreground
let receivedSubscription: any | null = null;

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
          shouldShowBanner: true,
          shouldShowList: true,
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

    // Android channel setup
    try {
      if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
        // Always ensure default channel
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
        // If custom sound is configured, create or update a dedicated channel that uses it
        if (customSoundFileName) {
          customSoundChannelId = 'adhan';
          await Notifications.setNotificationChannelAsync(customSoundChannelId, {
            name: 'Adhan',
            importance: Notifications.AndroidImportance.HIGH,
            sound: customSoundFileName, // The sound file must be bundled and declared via expo-notifications plugin
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.NOTIFICATION,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
            },
          });
        } else {
          customSoundChannelId = 'default';
        }
      }
    } catch {
      // ignore channel errors
    }

    // Foreground playback hook (optional)
    try {
      if (receivedSubscription) {
        receivedSubscription.remove?.();
        receivedSubscription = null;
      }
      if (foregroundPlaybackEnabled && Notifications?.addNotificationReceivedListener) {
        const { playAdhan } = await import('./audio');
        receivedSubscription = Notifications.addNotificationReceivedListener(async (event: any) => {
          try {
            // Attempt to play adhan sound if explicitly enabled; requires localModule or URI configuration in playAdhan call
            // This call is a best-effort and will no-op if not configured
            await playAdhan();
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore listener errors
    }

    notificationsReady = finalStatus === 'granted';
    return notificationsReady;
  } catch {
    Notifications = null;
    notificationsReady = false;
    return false;
  }
}

export function configureNotificationSound(options: { iosFileName?: string | null; androidFileName?: string | null } = {}): void {
  // Accept platform-specific names; if one is provided we consider custom sound configured
  const platformFile = Platform.select({ ios: options.iosFileName, android: options.androidFileName }) ?? null;
  customSoundFileName = platformFile || null;
}

export function enableForegroundAdhanPlayback(enable: boolean): void {
  foregroundPlaybackEnabled = enable;
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
        content: { title, body, data: { errorCode, context }, sound: Platform.OS === 'ios' ? (customSoundFileName || true) : true },
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
      const schedulePayload: any = {
        content: {
          title: `Prayer time: ${item.key}`,
          body: item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: { prayer: item.key },
          sound: Platform.OS === 'ios' ? (customSoundFileName || true) : true,
        },
        trigger: { date: item.date },
      };
      // Prefer a dedicated channel when custom sound is configured on Android
      if (Platform.OS === 'android' && customSoundFileName && customSoundChannelId) {
        schedulePayload.android = { channelId: customSoundChannelId };
      }
      const id = await Notifications.scheduleNotificationAsync(schedulePayload);
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

export async function triggerTestNotification(prayerKey: string = 'Test', secondsFromNow: number = 5): Promise<void> {
  if (!Notifications) {
    const ok = await initNotifications();
    if (!ok || !Notifications) return;
  }
  try {
    const fireDate = new Date(Date.now() + Math.max(1, secondsFromNow) * 1000);
    const payload: any = {
      content: {
        title: `Prayer time: ${prayerKey}`,
        body: fireDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: { prayer: prayerKey },
        sound: Platform.OS === 'ios' ? (customSoundFileName || true) : true,
      },
      trigger: { date: fireDate },
    };
    if (Platform.OS === 'android' && customSoundFileName && customSoundChannelId) {
      payload.android = { channelId: customSoundChannelId };
    }
    await Notifications.scheduleNotificationAsync(payload);
  } catch {
    // ignore test errors
  }
}
