import { useEffect, useRef, useState } from 'react';
import Voice from 'react-native-voice';

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
    Voice.onSpeechError = (e: any) => {
      if (isMounted.current) setError(e.error?.message || 'Unknown error');
      setListening(false);
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
    }
  };

  const stop = async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      setError(e.message || 'Could not stop voice recognition');
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