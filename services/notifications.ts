import { Alert, Platform } from 'react-native';

let Notifications: any | null = null;
let notificationsReady = false;

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
          shouldPlaySound: false,
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
          importance: Notifications.AndroidImportance.DEFAULT,
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
        content: { title, body, data: { errorCode, context } },
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
