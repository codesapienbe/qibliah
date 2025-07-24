import { useEffect, useState } from 'react';
// NOTE: You must install @react-native-async-storage/async-storage: npm install @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'assistant_messages';

/**
 * Custom hook to manage assistant messages with AsyncStorage persistence.
 * @param {Array<any>} initialMessages - Initial messages to use if storage is empty.
 * @returns {[Array<any>, React.Dispatch<React.SetStateAction<any[]>>, boolean]} - [messages, setMessages, loading]
 */
export function useAssistantMessages(initialMessages: any[] = []): [any[], React.Dispatch<React.SetStateAction<any[]>>, boolean] {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data: string | null) => {
        if (data) setMessages(JSON.parse(data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
    }
  }, [messages, loading]);

  return [messages, setMessages, loading];
} 