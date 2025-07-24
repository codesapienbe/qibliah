import { logError } from '@/utils/logger';
import { Magnetometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

function calculateHeading(magnetometer: { x: number; y: number; z: number }) {
  let { x, y } = magnetometer;
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  angle = angle >= 0 ? angle : angle + 360;
  return angle;
}

export function useQiblaDirection() {
  const [heading, setHeading] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const subscription = useRef<any>(null);

  const startCompass = useCallback(() => {
    if (subscription.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      subscription.current = Magnetometer.addListener((data) => {
        setLoading(false);
        setHeading(calculateHeading(data));
      });
      Magnetometer.setUpdateInterval(100); // 10 updates per second
    } catch (error: any) {
      logError(error, 'useQiblaDirection: startCompass');
      setLoading(false);
      setErrorMsg(`Compass error: ${error.message || 'Unknown error'}`);
    }
  }, []);

  const stopCompass = useCallback(() => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, [stopCompass]);

  // No permission needed for Magnetometer, but keep API for compatibility
  const requestPermission = useCallback(async () => true, []);

  return { heading, errorMsg, loading, requestPermission, startCompass, stopCompass };
}
