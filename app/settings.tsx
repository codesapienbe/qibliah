import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';
import { deleteGroqToken, getGroqToken, saveGroqToken } from '@/utils/tokenStorage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'en', label: 'english' },
  { code: 'nl', label: 'dutch' },
  { code: 'tr', label: 'turkish' },
];
const THEMES = [
  { code: 'system', label: 'system_theme' },
  { code: 'light', label: 'light_theme' },
  { code: 'dark', label: 'dark_theme' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const systemColorScheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [groqApiKey, setGroqApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showingMasked, setShowingMasked] = useState(true);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      const storedTheme = await AsyncStorage.getItem('app_theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') setTheme(storedTheme);
      const storedLang = await AsyncStorage.getItem('app_language');
      if (storedLang) setLanguage(storedLang);
      const storedToken = await getGroqToken();
      if (storedToken) {
        setGroqApiKey(storedToken);
        setTempApiKey('************');
        setShowingMasked(true);
      }
    })();
  }, []);

  // Apply theme override
  useEffect(() => {
    AsyncStorage.setItem('app_theme', theme);
    // Optionally, trigger a global theme update here
  }, [theme]);

  // Apply language
  useEffect(() => {
    AsyncStorage.setItem('app_language', language);
    i18n.changeLanguage(language);
  }, [language]);

  // Theme to use for preview
  const colorScheme = theme === 'system' ? systemColorScheme : theme;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: Colors[colorScheme].background, padding: 24 }}>
      <ThemedText type="title" style={{ fontWeight: 'bold', fontSize: 28, color: Colors[colorScheme].primary, marginBottom: 24 }}>{t('settings')}</ThemedText>
      {/* Language Picker */}
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: Colors[colorScheme].primary }]}>{t('language')}</ThemedText>
        <View style={styles.pickerRow}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[
                styles.pickerBtn,
                language === l.code
                  ? [styles.pickerBtnActive, { backgroundColor: Colors[colorScheme].primary, borderColor: Colors[colorScheme].primary }]
                  : { backgroundColor: Colors[colorScheme].surface, borderColor: Colors[colorScheme].primary },
              ]}
              onPress={() => setLanguage(l.code)}
            >
              <ThemedText style={{ color: language === l.code ? Colors[colorScheme].icon : Colors[colorScheme].primary }}>{t(l.label)}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Theme Picker */}
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: Colors[colorScheme].primary }]}>{t('theme')}</ThemedText>
        <View style={styles.pickerRow}>
          {THEMES.map(ti => (
            <TouchableOpacity
              key={ti.code}
              style={[
                styles.pickerBtn,
                theme === ti.code
                  ? [styles.pickerBtnActive, { backgroundColor: Colors[colorScheme].primary, borderColor: Colors[colorScheme].primary }]
                  : { backgroundColor: Colors[colorScheme].surface, borderColor: Colors[colorScheme].primary },
              ]}
              onPress={() => setTheme(ti.code as 'system' | 'light' | 'dark')}
            >
              <ThemedText style={{ color: theme === ti.code ? Colors[colorScheme].icon : Colors[colorScheme].primary }}>{t(ti.label)}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Groq API Key */}
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: Colors[colorScheme].primary }]}>{t('groq_api_key')}</ThemedText>
        <TouchableOpacity style={[styles.apiKeyBtn, { backgroundColor: Colors[colorScheme].surface, borderColor: Colors[colorScheme].primary }]} onPress={() => setShowApiKeyModal(true)}>
          <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold' }}>{groqApiKey ? '************' : t('set_api_key')}</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme].primary} />
        </TouchableOpacity>
      </View>
      {/* Groq API Key Modal */}
      <Modal visible={showApiKeyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].surface }]}> 
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: Colors[colorScheme].primary }}>{t('enter_groq_api_key')}</ThemedText>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, borderRadius: 8, padding: 10, width: '100%', marginBottom: 16, fontSize: 16, color: Colors[colorScheme].text, backgroundColor: Colors[colorScheme].surface }}
              placeholder={t('api_key_placeholder')}
              value={showingMasked && groqApiKey ? '************' : tempApiKey}
              onChangeText={text => {
                setTempApiKey(text);
                setShowingMasked(false);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              onFocus={() => {
                if (showingMasked && groqApiKey) {
                  setTempApiKey('');
                  setShowingMasked(false);
                }
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: Colors[colorScheme].primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                onPress={async () => {
                  if (!showingMasked || !groqApiKey) {
                    setGroqApiKey(tempApiKey);
                    await saveGroqToken(tempApiKey);
                  }
                  setShowApiKeyModal(false);
                  setTempApiKey('************');
                  setShowingMasked(true);
                }}
              >
                <ThemedText style={{ color: Colors[colorScheme].icon, fontWeight: 'bold', fontSize: 16 }}>{t('save')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: Colors[colorScheme].surface, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                onPress={() => {
                  setShowApiKeyModal(false);
                  setTempApiKey(groqApiKey ? '************' : '');
                  setShowingMasked(true);
                }}
              >
                <ThemedText style={{ color: Colors[colorScheme].icon, fontWeight: 'bold', fontSize: 16 }}>{t('cancel')}</ThemedText>
              </TouchableOpacity>
              {groqApiKey && (
                <TouchableOpacity
                  style={{ backgroundColor: Colors[colorScheme].error, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                  onPress={async () => {
                    await deleteGroqToken();
                    setGroqApiKey(null);
                    setTempApiKey('');
                    setShowApiKeyModal(false);
                    setShowingMasked(true);
                  }}
                >
                  <ThemedText style={{ color: Colors[colorScheme].icon, fontWeight: 'bold', fontSize: 16 }}>{t('remove_api_key')}</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 28,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  pickerBtnActive: {
  },
  apiKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
}); 