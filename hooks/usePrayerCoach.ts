import { defaultCoachConfig, defaultRakatTemplate, finalSteps, PrayerCoachConfig, PrayerStep } from '@/constants/PrayerCoach';
import { useMotionDetection } from '@/hooks/useMotionDetection';
import { useTripleTapDetector } from '@/hooks/useTripleTapDetector';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { setPlayAndRecordAudioMode, setPlaybackAudioMode, speak, speakSegments } from '@/services/audio';
import { appendPrayerEvent } from '@/services/prayerLog';
import * as Haptics from 'expo-haptics';
import React from 'react';

export interface PrayerCoachState {
  active: boolean;
  currentRakat: number;
  totalRakat: number;
  currentStepIndex: number;
  currentStep: PrayerStep | null;
  finished: boolean;
}

export interface PrayerCoachApi {
  state: PrayerCoachState;
  start: (config?: Partial<PrayerCoachConfig>) => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  repeat: () => Promise<void>;
}

export function usePrayerCoach(): PrayerCoachApi {
  const [config, setConfig] = React.useState<PrayerCoachConfig>(defaultCoachConfig);
  const [state, setState] = React.useState<PrayerCoachState>({
    active: false,
    currentRakat: 1,
    totalRakat: defaultCoachConfig.totalRakat,
    currentStepIndex: 0,
    currentStep: defaultRakatTemplate.steps[0] ?? null,
    finished: false,
  });

  const { results, partial, start: startVoice, stop: stopVoice } = useVoiceInput();
  const { detectedAt, start: startTripleTap, stop: stopTripleTap } = useTripleTapDetector();
  const { reading, start: startMotion, stop: stopMotion } = useMotionDetection(100);

  const say = React.useCallback(async (text: string) => {
    await speak(text, config.language, { gender: config.voiceGender });
  }, [config.language, config.voiceGender]);

  const sayStep = React.useCallback(async (step: PrayerStep) => {
    const segments: Array<{ text: string; lang: string; gender?: 'male' | 'female' }> = [];
    if (step.spokenPromptEn) segments.push({ text: step.spokenPromptEn, lang: config.language, gender: config.voiceGender });
    if (step.spokenPromptAr && config.arabicLanguage) segments.push({ text: step.spokenPromptAr, lang: config.arabicLanguage, gender: config.voiceGender });
    if (Array.isArray(step.duaAr) && step.duaAr.length && config.arabicLanguage) {
      for (const dua of step.duaAr) {
        segments.push({ text: dua, lang: config.arabicLanguage, gender: config.voiceGender });
      }
    }
    if (segments.length === 1) {
      await speak(segments[0].text, segments[0].lang, { gender: segments[0].gender });
    } else if (segments.length > 1) {
      await speakSegments(segments);
    }
  }, [config.language, config.arabicLanguage, config.voiceGender]);

  const haptic = React.useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
  }, []);

  const applyStep = React.useCallback(async (newIndex: number, newRakat: number) => {
    const step = defaultRakatTemplate.steps[newIndex] || null;
    setState((s) => ({
      ...s,
      currentRakat: newRakat,
      currentStepIndex: newIndex,
      currentStep: step,
      finished: false,
    }));
    await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'next_step', payload: { newIndex, newRakat, stepId: step?.id } });
    await haptic();
    if (step) {
      await sayStep(step);
    }
  }, [sayStep, haptic]);

  const speakFinalization = React.useCallback(async () => {
    for (const step of finalSteps) {
      await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'finalization_step', payload: { stepId: step.id } });
      await haptic();
      await sayStep(step);
    }
  }, [sayStep, haptic]);

  const next = React.useCallback(async () => {
    setState((s) => s);
    const isLastStep = state.currentStepIndex >= defaultRakatTemplate.steps.length - 1;
    if (isLastStep) {
      const isLastRakat = state.currentRakat >= config.totalRakat;
      if (isLastRakat) {
        await speakFinalization();
        await haptic();
        await say('Prayer guidance complete.');
        setState((s) => ({ ...s, finished: true }));
        await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'stop', payload: { reason: 'complete' } });
        await stop();
        return;
      }
      await applyStep(0, state.currentRakat + 1);
      return;
    }
    await applyStep(state.currentStepIndex + 1, state.currentRakat);
  }, [state.currentRakat, state.currentStepIndex, config.totalRakat, applyStep, say, haptic, speakFinalization]);

  const repeat = React.useCallback(async () => {
    if (state.currentStep) {
      await haptic();
      await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'repeat_step', payload: { stepId: state.currentStep.id } });
      await sayStep(state.currentStep);
    }
  }, [sayStep, haptic, state.currentStep]);

  const start = React.useCallback(async (userConfig?: Partial<PrayerCoachConfig>) => {
    const merged = { ...config, ...(userConfig || {}) };
    setConfig(merged);
    setState({
      active: true,
      currentRakat: 1,
      totalRakat: merged.totalRakat,
      currentStepIndex: 0,
      currentStep: defaultRakatTemplate.steps[0] ?? null,
      finished: false,
    });
    await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'config', payload: merged });
    await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'start' });
    await haptic();
    await speak('Starting prayer guidance.', merged.language, { gender: merged.voiceGender });

    // Mode-specific enablement
    if (merged.mode === 'listen') {
      await setPlayAndRecordAudioMode();
      startVoice(merged.language);
      startTripleTap(); // keep tap as silent fallback even in listen mode
      stopMotion(); // no pose-based auto-advance in listen mode
    } else if (merged.mode === 'watch') {
      await setPlaybackAudioMode(); // playback only; camera/pose will be added later
      startMotion();
      stopTripleTap();
      stopVoice();
    } else {
      // click mode: only manual tap/press; keep triple-tap convenience, no voice, no motion auto-advance
      await setPlaybackAudioMode();
      startTripleTap();
      stopMotion();
      stopVoice();
    }
  }, [config, startMotion, startTripleTap, startVoice, haptic]);

  const stop = React.useCallback(async () => {
    setState((s) => ({ ...s, active: false }));
    await appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'stop', payload: { reason: 'user' } });
    stopMotion();
    stopTripleTap();
    stopVoice();
    await setPlaybackAudioMode();
  }, [stopMotion, stopTripleTap, stopVoice]);

  React.useEffect(() => {
    if (!state.active) return;
    if (config.mode !== 'listen') return;
    const texts = [...(results || []), partial || '']
      .map((t) => (t || '').toLowerCase())
      .filter(Boolean);
    const aggregated = texts.join(' ');
    if (aggregated.includes('next')) {
      appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'voice_command', payload: { command: 'next' } });
      next();
    } else if (aggregated.includes('repeat')) {
      appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'voice_command', payload: { command: 'repeat' } });
      repeat();
    }
  }, [results, partial, state.active, next, repeat, config.mode]);

  React.useEffect(() => {
    if (!state.active) return;
    if (config.mode !== 'click') return;
    if (detectedAt) {
      appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'tap_advance' });
      next();
    }
  }, [detectedAt, state.active, next, config.mode]);

  // Throttled pose reading logging for time-series stats
  const lastPoseLogRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (!state.active) return;
    if (config.mode !== 'watch') return;
    const now = Date.now();
    if (now - lastPoseLogRef.current > 2000) {
      lastPoseLogRef.current = now;
      appendPrayerEvent({
        timestamp: new Date().toISOString(),
        type: 'pose_reading',
        payload: { pose: reading.pose, confidence: reading.confidence, at: reading.lastUpdatedAt },
      });
    }
  }, [reading.pose, reading.confidence, reading.lastUpdatedAt, state.active, config.mode]);

  React.useEffect(() => {
    if (!state.active || !config.autoAdvanceFromPose) return;
    if (config.mode !== 'watch') return;
    const step = state.currentStep;
    if (!step) return;
    if (reading.pose && reading.confidence >= 0.5) {
      if (reading.pose === step.pose) {
        appendPrayerEvent({ timestamp: new Date().toISOString(), type: 'auto_pose_advance', payload: { pose: reading.pose, confidence: reading.confidence } });
        next();
      }
    }
  }, [reading.pose, reading.confidence, state.active, state.currentStep, config.autoAdvanceFromPose, next, config.mode]);

  return { state, start, stop, next, repeat };
}
