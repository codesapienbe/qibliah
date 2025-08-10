let SoundModule: any | null = null;
let SpeechModule: any | null = null;
let currentSound: any | null = null;

async function ensureSoundModule() {
  if (!SoundModule) {
    try {
      SoundModule = await import('expo-av');
    } catch {
      SoundModule = null;
    }
  }
  return SoundModule;
}

async function ensureSpeechModule() {
  if (!SpeechModule) {
    try {
      SpeechModule = await import('expo-speech');
    } catch {
      SpeechModule = null;
    }
  }
  return SpeechModule;
}

export async function setPlaybackAudioMode(): Promise<void> {
  const mod = await ensureSoundModule();
  if (!mod) return;
  try {
    await mod.Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: mod.Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      shouldDuckAndroid: true,
      interruptionModeAndroid: mod.Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

export async function setPlayAndRecordAudioMode(): Promise<void> {
  const mod = await ensureSoundModule();
  if (!mod) return;
  try {
    await mod.Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: mod.Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      shouldDuckAndroid: true,
      interruptionModeAndroid: mod.Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

export async function playAdhan(options?: { uri?: string; localModule?: number; volume?: number; shouldLoop?: boolean }): Promise<boolean> {
  const mod = await ensureSoundModule();
  if (!mod) return false;
  try {
    // Ensure playback in iOS silent mode and proper session
    await setPlaybackAudioMode();

    if (currentSound) {
      await currentSound.stopAsync().catch(() => {});
      await currentSound.unloadAsync().catch(() => {});
      currentSound = null;
    }

    const { Sound } = mod.Audio;
    const sound = new Sound();

    if (options?.localModule) {
      await sound.loadAsync(options.localModule);
    } else if (options?.uri) {
      await sound.loadAsync({ uri: options.uri });
    } else {
      return false;
    }

    if (typeof options?.volume === 'number') {
      await sound.setVolumeAsync(options.volume);
    }
    if (typeof options?.shouldLoop === 'boolean') {
      await sound.setIsLoopingAsync(options.shouldLoop);
    }

    await sound.playAsync();
    currentSound = sound;
    return true;
  } catch {
    return false;
  }
}

export async function stopAdhan(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch {
    // no-op
  }
}

export async function stopAllAudio(): Promise<void> {
  try {
    const Speech = await ensureSpeechModule();
    await Speech?.stop?.();
  } catch {}
  try {
    await stopAdhan();
  } catch {}
  try {
    await setPlaybackAudioMode();
  } catch {}
}

function pickVoiceForGender(voices: any[], targetGender?: 'male' | 'female', language?: string) {
  if (!Array.isArray(voices)) return undefined;
  const byLang = language ? voices.filter((v: any) => (v.language || '').toLowerCase().startsWith(language.toLowerCase().slice(0,2))) : voices;
  if (targetGender) {
    const genderMatch = byLang.find((v: any) => (v.gender || '').toLowerCase() === targetGender);
    if (genderMatch) return genderMatch.identifier;
  }
  const fallback = byLang[0];
  return fallback?.identifier;
}

export async function speak(text: string, lang: string = 'en', options?: { gender?: 'male' | 'female' }): Promise<boolean> {
  const Speech = await ensureSpeechModule();
  if (!Speech) return false;
  try {
    let voice: string | undefined = undefined;
    try {
      const available = await Speech.getAvailableVoicesAsync?.();
      voice = pickVoiceForGender(available || [], options?.gender, lang);
    } catch {}
    await Speech.speak(text, {
      language: lang,
      pitch: 1.0,
      rate: 0.9,
      voice,
    });
    return true;
  } catch {
    return false;
  }
}

export async function speakSegments(segments: Array<{ text: string; lang: string; gender?: 'male' | 'female' }>): Promise<void> {
  const Speech = await ensureSpeechModule();
  if (!Speech) return;
  let available: any[] = [];
  try {
    available = (await Speech.getAvailableVoicesAsync?.()) || [];
  } catch {}
  for (const seg of segments) {
    const voice = pickVoiceForGender(available, seg.gender, seg.lang);
    await new Promise<void>((resolve) => {
      Speech.speak(seg.text, {
        language: seg.lang,
        pitch: 1.0,
        rate: 0.9,
        voice,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  }
}
