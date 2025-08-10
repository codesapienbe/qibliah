import { logError } from '@/utils/logger';
import { useEffect, useRef, useState } from 'react';
import Voice from 'react-native-voice';

export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [partial, setPartial] = useState<string>('');

  // Keep a ref to avoid stale closures
  const isMounted = useRef(true);
  const continuousRef = useRef(false);
  const langRef = useRef<string>('en-US');
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startingRef = useRef<boolean>(false);
  const errorWindowCountRef = useRef<number>(0);
  const errorWindowStartRef = useRef<number>(0);

  useEffect(() => {
    isMounted.current = true;
    Voice.onSpeechStart = (_e: any) => {
      if (isMounted.current) setListening(true);
      startingRef.current = false;
    };
    Voice.onSpeechEnd = async (_e: any) => {
      if (isMounted.current) setListening(false);
      if (continuousRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current as any);
        restartTimeoutRef.current = setTimeout(async () => {
          if (startingRef.current) return;
          startingRef.current = true;
          try { await Voice.start(langRef.current); } catch {}
        }, 500);
      }
    };
    Voice.onSpeechResults = async (e: any) => {
      if (isMounted.current) setResults(e.value || []);
      // Do not force-restart on results; allow onSpeechEnd to handle restart
    };
    Voice.onSpeechPartialResults = (e: any) => {
      if (isMounted.current) setPartial(e.value?.[0] || '');
    };
    Voice.onSpeechError = async (e: any) => {
      const message = e.error?.message || 'Unknown error';
      if (isMounted.current) setError(message);
      setListening(false);

      // Error rate limiter: if >=3 errors within 10s, stop continuous mode to prevent loops
      const nowTs = Date.now();
      if (nowTs - (errorWindowStartRef.current || 0) > 10000) {
        errorWindowStartRef.current = nowTs;
        errorWindowCountRef.current = 0;
      }
      errorWindowCountRef.current += 1;
      const tooNoisy = errorWindowCountRef.current >= 3;

      // Attempt recovery in continuous mode
      if (continuousRef.current && !tooNoisy) {
        try { await Voice.cancel(); } catch {}
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current as any);
        restartTimeoutRef.current = setTimeout(async () => {
          if (startingRef.current) return;
          startingRef.current = true;
          try { await Voice.start(langRef.current); } catch {}
        }, 1000);
      } else if (continuousRef.current && tooNoisy) {
        // Circuit-breaker: stop attempts to restart and switch off continuous mode
        continuousRef.current = false;
        startingRef.current = false;
        try { await Voice.stop(); } catch {}
      }
      try {
        await logError(new Error(message), 'useVoiceInput:onSpeechError', {
          throttleKey: 'voice_error',
          throttleMs: 60000,
          notify: false,
        });
      } catch {}
    };
    return () => {
      isMounted.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current as any);
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const start = async (lang = 'en-US') => {
    setError(null);
    setResults([]);
    setPartial('');
    langRef.current = lang;
    continuousRef.current = false;
    startingRef.current = true;
    errorWindowStartRef.current = 0;
    errorWindowCountRef.current = 0;
    try {
      await Voice.start(lang);
    } catch (e: any) {
      setError(e.message || 'Could not start voice recognition');
      try { await logError(e, 'useVoiceInput:start'); } catch {}
    }
  };

  const startContinuous = async (lang = 'en-US') => {
    setError(null);
    setResults([]);
    setPartial('');
    langRef.current = lang;
    continuousRef.current = true;
    startingRef.current = true;
    errorWindowStartRef.current = 0;
    errorWindowCountRef.current = 0;
    try {
      await Voice.start(lang);
    } catch (e: any) {
      setError(e.message || 'Could not start voice recognition');
      try { await logError(e, 'useVoiceInput:startContinuous'); } catch {}
    }
  };

  const stop = async () => {
    continuousRef.current = false;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current as any);
    startingRef.current = false;
    errorWindowStartRef.current = 0;
    errorWindowCountRef.current = 0;
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
    startContinuous,
    stop,
  };
} 