import { logError } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import CompassHeading from 'react-native-compass-heading';

export function useQiblaDirection() {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const compassStarted = useRef(false);

  // Only requests permission (if needed)
  const requestPermission = useCallback(async () => {
    // On iOS/Android, compass permission is usually included with location, but you may want to check platform specifics here
    // For now, just resolve true
    try {
      return true;
    } catch (error) {
      logError(error, 'useQiblaDirection: requestPermission');
      return false;
    }
  }, []);

  // Start listening to compass
  const startCompass = useCallback(() => {
    if (compassStarted.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      CompassHeading.start(3, ({ heading, accuracy }: { heading: number; accuracy: number }) => {
        setLoading(false);
        if (accuracy > 0) {
          setHeading(heading);
          setAccuracy(accuracy);
          setErrorMsg(null);
        } else {
          setErrorMsg('Poor compass accuracy. Please calibrate your device by moving it in a figure-8 pattern.');
        }
      });
      compassStarted.current = true;
    } catch (error: any) {
      logError(error, 'useQiblaDirection: startCompass');
      setLoading(false);
      setErrorMsg(`Compass error: ${error.message || 'Unknown error'}`);
    }
  }, []);

  // Stop compass
  const stopCompass = useCallback(() => {
    try {
      CompassHeading.stop();
      compassStarted.current = false;
    } catch (error) {
      // ignore
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, [stopCompass]);

  return { heading, accuracy, errorMsg, loading, requestPermission, startCompass, stopCompass };
}
