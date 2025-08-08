import { useEffect, useRef, useState } from 'react';
import Voice from 'react-native-voice';
import { logError } from '@/utils/logger';

export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [partial, setPartial] = useState<string>('');

  // Keep a ref to avoid stale closures
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    Voice.onSpeechStart = (_e: any) => {
      if (isMounted.current) setListening(true);
    };
    Voice.onSpeechEnd = (_e: any) => {
      if (isMounted.current) setListening(false);
    };
    Voice.onSpeechResults = (e: any) => {
      if (isMounted.current) setResults(e.value || []);
    };
    Voice.onSpeechPartialResults = (e: any) => {
      if (isMounted.current) setPartial(e.value?.[0] || '');
    };
    Voice.onSpeechError = async (e: any) => {
      const message = e.error?.message || 'Unknown error';
      if (isMounted.current) setError(message);
      setListening(false);
      try {
        await logError(new Error(message), 'useVoiceInput:onSpeechError');
      } catch {}
    };
    return () => {
      isMounted.current = false;
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const start = async (lang = 'en-US') => {
    setError(null);
    setResults([]);
    setPartial('');
    try {
      await Voice.start(lang);
    } catch (e: any) {
      setError(e.message || 'Could not start voice recognition');
      try { await logError(e, 'useVoiceInput:start'); } catch {}
    }
  };

  const stop = async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      setError(e.message || 'Could not stop voice recognition');
      try { await logError(e, 'useVoiceInput:stop'); } catch {}
    }
  };

  return {
    listening,
    error,
    results,
    partial,
    start,
    stop,
  };
} 