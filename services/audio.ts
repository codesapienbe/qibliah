let SoundModule: any | null = null;
let currentSound: any | null = null;

async function ensureModule() {
  if (!SoundModule) {
    try {
      SoundModule = await import('expo-av');
    } catch {
      SoundModule = null;
    }
  }
  return SoundModule;
}

export async function playAdhan(options?: { uri?: string; localModule?: number; volume?: number; shouldLoop?: boolean }): Promise<boolean> {
  const mod = await ensureModule();
  if (!mod) return false;
  try {
    // Ensure playback in iOS silent mode
    try {
      await mod.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    } catch {
      // ignore
    }

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
