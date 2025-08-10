import { Accelerometer, Gyroscope } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrayerPose } from '@/constants/PrayerCoach';
import { logError } from '@/utils/logger';

export interface MotionPoseReading {
  pose: PrayerPose | null;
  confidence: number; // 0..1
  lastUpdatedAt: number;
}

export function useMotionDetection(updateIntervalMs: number = 100) {
  const [reading, setReading] = useState<MotionPoseReading>({ pose: null, confidence: 0, lastUpdatedAt: Date.now() });
  const accelSub = useRef<any>(null);
  const gyroSub = useRef<any>(null);

  const inferPose = useCallback((accel: { x: number; y: number; z: number }, gyro: { x: number; y: number; z: number }): MotionPoseReading => {
    // Simple heuristic MVP:
    // - Low motion + gravity roughly upwards => standing/sitting
    // - Moderate forward tilt + low motion => ruku
    // - High motion burst + low roll/pitch velocity afterwards near ground => sujud
    const g = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    const motion = Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);

    // Normalize gravity difference from 1g
    const gravityDeviation = Math.abs(g - 1.0);

    let pose: PrayerPose | null = null;
    let confidence = 0;

    if (motion < 0.2 && gravityDeviation < 0.12) {
      // Very still, close to 1g
      // Distinguish standing vs sitting is unreliable with phone orientation; mark as standing with low confidence
      pose = 'standing';
      confidence = 0.4;
    } else if (motion < 0.35 && gravityDeviation >= 0.12 && gravityDeviation < 0.35) {
      pose = 'ruku';
      confidence = 0.35;
    } else if (gravityDeviation >= 0.35 && motion < 0.25) {
      pose = 'sujud';
      confidence = 0.3;
    }

    // Note: distinguishing sitting reliably is hard without orientation; keep as null for now unless low motion persists
    if (!pose && motion < 0.15 && gravityDeviation < 0.15) {
      pose = 'sitting';
      confidence = 0.2;
    }

    return { pose, confidence, lastUpdatedAt: Date.now() };
  }, []);

  const start = useCallback(() => {
    try {
      if (!accelSub.current) {
        accelSub.current = Accelerometer.addListener(() => {});
        Accelerometer.setUpdateInterval(updateIntervalMs);
      }
      if (!gyroSub.current) {
        gyroSub.current = Gyroscope.addListener(() => {});
        Gyroscope.setUpdateInterval(updateIntervalMs);
      }
    } catch (e: any) {
      logError(e, 'useMotionDetection:start').catch(() => {});
    }
  }, [updateIntervalMs]);

  const stop = useCallback(() => {
    try {
      if (accelSub.current) {
        accelSub.current.remove();
        accelSub.current = null;
      }
      if (gyroSub.current) {
        gyroSub.current.remove();
        gyroSub.current = null;
      }
    } catch (e: any) {
      logError(e, 'useMotionDetection:stop').catch(() => {});
    }
  }, []);

  useEffect(() => {
    let latestAccel = { x: 0, y: 0, z: 1 };
    let latestGyro = { x: 0, y: 0, z: 0 };

    const onAccel = (data: any) => {
      latestAccel = data;
      const r = inferPose(latestAccel, latestGyro);
      setReading(r);
    };
    const onGyro = (data: any) => {
      latestGyro = data;
      const r = inferPose(latestAccel, latestGyro);
      setReading(r);
    };

    try {
      accelSub.current = Accelerometer.addListener(onAccel);
      gyroSub.current = Gyroscope.addListener(onGyro);
      Accelerometer.setUpdateInterval(updateIntervalMs);
      Gyroscope.setUpdateInterval(updateIntervalMs);
    } catch (e: any) {
      logError(e, 'useMotionDetection:subscribe').catch(() => {});
    }

    return () => {
      try {
        accelSub.current?.remove?.();
        gyroSub.current?.remove?.();
        accelSub.current = null;
        gyroSub.current = null;
      } catch {}
    };
  }, [inferPose, updateIntervalMs]);

  return { reading, start, stop };
}
