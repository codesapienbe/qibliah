import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePrayerCoach } from '@/hooks/usePrayerCoach';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Switch, TextInput, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { readAllPrayerEvents } from '@/services/prayerLog';
import type { PrayerCoachMode } from '@/constants/PrayerCoach';

export default function PrayerScreen() {
  const { t } = useTranslation();
  const coach = usePrayerCoach();

  const [rakat, setRakat] = React.useState(2);
  const [autoAdvance, setAutoAdvance] = React.useState(true);
  const [voiceLang, setVoiceLang] = React.useState('en-US');
  const [voiceGender, setVoiceGender] = React.useState<'male' | 'female'>('male');
  const [loadedEventsCount, setLoadedEventsCount] = React.useState(0);
  const [mode, setMode] = React.useState<PrayerCoachMode>('click');

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('PRAYER_COACH_INFO', () => {
      // Future: Show an info modal explaining the feature
    });
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    (async () => {
      const all = await readAllPrayerEvents();
      setLoadedEventsCount(all.length);
    })();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="walk-outline" size={22} style={styles.headerIcon} />
        <ThemedText type="title">{t('prayer_coach_title', { defaultValue: 'Prayer Coach' })}</ThemedText>
      </View>

      <ThemedText style={styles.subtitle}>
        {t('prayer_coach_subtitle', {
          defaultValue: 'Gentle, step-by-step guidance with short voice prompts and haptic cues.',
        })}
      </ThemedText>

      <Collapsible title={t('settings', { defaultValue: 'Settings' })}>
        <View style={styles.settingsRow}>
          <ThemedText style={styles.settingsLabel}>Mode</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setMode('click')} style={[styles.segment, mode === 'click' && styles.segmentActive]}>
              <ThemedText>Click</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setMode('listen')} style={[styles.segment, mode === 'listen' && styles.segmentActive]}>
              <ThemedText>Listen</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setMode('watch')} style={[styles.segment, mode === 'watch' && styles.segmentActive]}>
              <ThemedText>Watch</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.settingsRow}> 
          <ThemedText style={styles.settingsLabel}>Rakat</ThemedText>
          <TextInput
            value={String(rakat)}
            onChangeText={(txt) => {
              const n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
              if (!Number.isNaN(n)) setRakat(Math.max(1, Math.min(20, n)));
              else setRakat(2);
            }}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Rakat count"
          />
        </View>
        <View style={styles.settingsRow}> 
          <ThemedText style={styles.settingsLabel}>Auto-advance from pose</ThemedText>
          <Switch value={autoAdvance} onValueChange={setAutoAdvance} />
        </View>
        <View style={styles.settingsRow}> 
          <ThemedText style={styles.settingsLabel}>Voice language</ThemedText>
          <TextInput
            value={voiceLang}
            onChangeText={setVoiceLang}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="Voice language code"
            placeholder="en-US"
          />
        </View>
        <View style={styles.settingsRow}> 
          <ThemedText style={styles.settingsLabel}>Voice gender</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setVoiceGender('male')}
              style={[styles.segment, voiceGender === 'male' && styles.segmentActive]}
            >
              <ThemedText>Male</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setVoiceGender('female')}
              style={[styles.segment, voiceGender === 'female' && styles.segmentActive]}
            >
              <ThemedText>Female</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <ThemedText style={{ opacity: 0.7 }}>Logged events: {loadedEventsCount}</ThemedText>
      </Collapsible>

      <View style={styles.card}>
        <ThemedText type="subtitle">
          {t('prayer_coach_quick_start', { defaultValue: 'Quick Start' })}
        </ThemedText>
        <ThemedText style={styles.cardHint}>
          {t('prayer_coach_quick_start_hint', {
            defaultValue: 'Hold your phone in your hand or keep it nearby. Tap the button below to begin.',
          })}
        </ThemedText>

        {!coach.state.active ? (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.startButton}
            onPress={() => coach.start({ totalRakat: rakat, autoAdvanceFromPose: autoAdvance, language: voiceLang, voiceGender, mode })}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <ThemedText style={styles.startButtonText}>
              {t('prayer_coach_start', { defaultValue: 'Start Guidance' })}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity accessibilityRole="button" style={[styles.startButton, { backgroundColor: '#d9534f' }]} onPress={() => coach.stop()}>
              <Ionicons name="stop" size={18} color="#fff" />
              <ThemedText style={styles.startButtonText}>Stop</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.startButton} onPress={() => coach.next()}>
              <Ionicons name="play-skip-forward" size={18} color="#fff" />
              <ThemedText style={styles.startButtonText}>Next</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.startButton} onPress={() => coach.repeat()}>
              <Ionicons name="repeat" size={18} color="#fff" />
              <ThemedText style={styles.startButtonText}>Repeat</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoList}>
        <ThemedText style={styles.infoItem}>
          • {t('prayer_coach_tip_voice', { defaultValue: 'Use short whisper-level commands like: "next", "repeat".' })}
        </ThemedText>
        <ThemedText style={styles.infoItem}>
          • {t('prayer_coach_tip_tap', { defaultValue: 'Triple-tap the phone back gently to advance if voice is uncomfortable.' })}
        </ThemedText>
        <ThemedText style={styles.infoItem}>
          • {t('prayer_coach_tip_safety', { defaultValue: 'Focus on your prayer. The phone will keep prompts minimal.' })}
        </ThemedText>
        {mode === 'watch' && (
          <ThemedText style={styles.infoItem}>
            • Prepare to align the phone so the camera can see your pose. Camera-based recognition will arrive soon.
          </ThemedText>
        )}
      </View>

      {coach.state.active && (
        <View style={styles.statusCard}>
          <ThemedText type="subtitle">Live</ThemedText>
          <ThemedText>
            Rakat: {coach.state.currentRakat}/{coach.state.totalRakat}
          </ThemedText>
          <ThemedText>
            Step: {coach.state.currentStep?.id ?? '-'} ({coach.state.currentStep?.hintEn ?? ''})
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    opacity: 0.8,
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  cardHint: {
    opacity: 0.8,
  },
  startButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
  },
  infoList: {
    marginTop: 8,
    gap: 6,
  },
  infoItem: {
    opacity: 0.9,
  },
  statusCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingsLabel: {
    fontSize: 16,
  },
  input: {
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  segment: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentActive: {
    backgroundColor: 'rgba(10, 126, 164, 0.12)',
  },
});
