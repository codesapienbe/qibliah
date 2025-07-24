import { useEffect, useState } from 'react';
// NOTE: You must install @react-native-async-storage/async-storage: npm install @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'assistant_messages';

/**
 * Custom hook to manage assistant messages with AsyncStorage persistence.
 * @param {Array<any>} initialMessages - Initial messages to use if storage is empty.
 * @param {(key: string) => string} [t] - Optional translation function for welcome message.
 * @returns {[Array<any>, React.Dispatch<React.SetStateAction<any[]>>, boolean]} - [messages, setMessages, loading]
 */
export function useAssistantMessages(initialMessages: any[] = [], t?: (key: string) => string): [any[], React.Dispatch<React.SetStateAction<any[]>>, boolean] {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data: string | null) => {
        if (data) {
          let loaded = JSON.parse(data);
          // Always update the initial message's text to the current translation
          if (
            loaded.length > 0 &&
            loaded[0].isInitial &&
            typeof t === 'function'
          ) {
            loaded[0].text = t('assistant_welcome');
          }
          setMessages(loaded);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
    }
  }, [messages, loading]);

  return [messages, setMessages, loading];
} 