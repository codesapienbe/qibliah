import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendErrorNotification } from '@/services/notifications';

const LOG_KEY = 'APP_ERROR_LOGS';

function generateErrorCode(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).toUpperCase();
  return 'ERR-' + hex.slice(0, 6).padStart(6, '0');
}

export async function logError(error: any, context: string = ''): Promise<string> {
  const canonical = `${context}::${error?.message || String(error)}::${error?.stack || ''}`;
  const code = generateErrorCode(canonical);
  try {
    const prev = await AsyncStorage.getItem(LOG_KEY);
    const logs = prev ? JSON.parse(prev) : [];
    logs.push({
      timestamp: new Date().toISOString(),
      context,
      error: error?.message || String(error),
      stack: error?.stack || null,
      code,
    });
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (storageError) {
    // fallback: still don't throw
    console.warn('Failed to log error:', storageError);
  }

  try {
    await sendErrorNotification(code, context, error?.message);
  } catch {
    // ignore notification errors
  }

  return code;
}

export async function getErrorLogs() {
  const logs = await AsyncStorage.getItem(LOG_KEY);
  return logs ? JSON.parse(logs) : [];
} 