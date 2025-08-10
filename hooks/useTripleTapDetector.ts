import { logError } from '@/utils/logger';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TripleTapOptions {
  windowMs?: number; // time window to capture taps
  minSpikes?: number; // spikes required (default 3)
  thresholdG?: number; // spike magnitude threshold relative to ~1g baseline
  updateIntervalMs?: number;
}

export function useTripleTapDetector(options?: TripleTapOptions) {
  const windowMs = options?.windowMs ?? 800;
  const minSpikes = options?.minSpikes ?? 3;
  const thresholdG = options?.thresholdG ?? 2.0;
  const updateIntervalMs = options?.updateIntervalMs ?? 50;

  const [detectedAt, setDetectedAt] = useState<number | null>(null);
  const sub = useRef<any>(null);
  const spikesRef = useRef<number[]>([]);

  const start = useCallback(() => {
    try {
      if (sub.current) return;
      sub.current = Accelerometer.addListener((data) => {
        const g = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        const spike = Math.abs(g - 1.0);
        const now = Date.now();
        // Maintain sliding window
        spikesRef.current = spikesRef.current.filter((t) => now - t < windowMs);
        if (spike >= thresholdG) {
          spikesRef.current.push(now);
        }
        if (spikesRef.current.length >= minSpikes) {
          setDetectedAt(now);
          spikesRef.current = [];
        }
      });
      Accelerometer.setUpdateInterval(updateIntervalMs);
    } catch (e: any) {
      logError(e, 'useTripleTapDetector:start').catch(() => {});
    }
  }, [thresholdG, updateIntervalMs, windowMs, minSpikes]);

  const stop = useCallback(() => {
    try {
      sub.current?.remove?.();
      sub.current = null;
      spikesRef.current = [];
    } catch (e: any) {
      logError(e, 'useTripleTapDetector:stop').catch(() => {});
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { detectedAt, start, stop };
}
