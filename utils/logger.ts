import { sendErrorNotification } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = 'APP_ERROR_LOGS';

const lastNotifyAtByKey: Record<string, number> = {};
const lastLogAtByKey: Record<string, number> = {};

function generateErrorCode(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).toUpperCase();
  return 'ERR-' + hex.slice(0, 6).padStart(6, '0');
}

export interface LogErrorOptions {
  notify?: boolean; // default true
  throttleKey?: string; // if provided, both logging and notifications throttle by this key
  throttleMs?: number; // default 60000ms when throttleKey is present
}

export async function logError(error: any, context: string = '', options: LogErrorOptions = {}): Promise<string> {
  const canonical = `${context}::${error?.message || String(error)}::${error?.stack || ''}`;
  const code = generateErrorCode(canonical);

  const throttleKey = options.throttleKey;
  const now = Date.now();
  const throttleMs = typeof options.throttleMs === 'number' ? Math.max(0, options.throttleMs) : 60000;

  // Throttle both logging and notifications if a key is provided
  if (throttleKey) {
    const lastLog = lastLogAtByKey[throttleKey] || 0;
    if (now - lastLog < throttleMs) {
      return code;
    }
    lastLogAtByKey[throttleKey] = now;
  }

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

  const shouldNotify = options.notify !== false;
  if (shouldNotify) {
    if (throttleKey) {
      const last = lastNotifyAtByKey[throttleKey] || 0;
      if (now - last < throttleMs) {
        return code; // skip notification due to throttle
      }
      lastNotifyAtByKey[throttleKey] = now;
    }
    try {
      await sendErrorNotification(code, context, error?.message);
    } catch {
      // ignore notification errors
    }
  }

  return code;
}

export async function getErrorLogs() {
  const logs = await AsyncStorage.getItem(LOG_KEY);
  return logs ? JSON.parse(logs) : [];
} 