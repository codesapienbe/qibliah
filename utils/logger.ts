import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = 'APP_ERROR_LOGS';

export async function logError(error: any, context: string = '') {
  try {
    const prev = await AsyncStorage.getItem(LOG_KEY);
    const logs = prev ? JSON.parse(prev) : [];
    logs.push({
      timestamp: new Date().toISOString(),
      context,
      error: error?.message || String(error),
      stack: error?.stack || null,
    });
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch (storageError) {
    // fallback: still don't throw
    console.warn('Failed to log error:', storageError);
  }
}

export async function getErrorLogs() {
  const logs = await AsyncStorage.getItem(LOG_KEY);
  return logs ? JSON.parse(logs) : [];
} 