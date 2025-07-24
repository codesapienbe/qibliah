import { askGroq } from '@/api';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAssistantMessages } from '@/hooks/useAssistantMessages';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { formatSurahAyatMessage } from '@/utils/formatSurahAyatMessage';
import { deleteGroqToken, getGroqToken, saveGroqToken } from '@/utils/tokenStorage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INITIAL_MESSAGES = [
  {
    id: 'ai-0',
    sender: 'ai',
    text: "__I18N_ASSISTANT_WELCOME__", // Will be replaced with t('assistant_welcome')
    isInitial: true,
  },
];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages, messagesLoading] = useAssistantMessages([
    { ...INITIAL_MESSAGES[0], text: t('assistant_welcome') },
  ], t);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [groqApiKey, setGroqApiKey] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showingMasked, setShowingMasked] = useState(true);
  const [rememberChat, setRememberChat] = useState(true);
  const [showRememberModal, setShowRememberModal] = useState(false);
  const [pendingRemember, setPendingRemember] = useState(rememberChat);
  const { listening, error: voiceError, results: voiceResults, partial, start, stop } = useVoiceInput();

  React.useEffect(() => {
    // Load Groq API token from secure storage on mount
    (async () => {
      const storedToken = await getGroqToken();
      if (storedToken) {
        setGroqApiKey(storedToken);
        setTempApiKey('************');
        setShowingMasked(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    // Update welcome message when language changes
    setMessages(prev => {
      if (prev.length > 0 && prev[0].isInitial) {
        // If the first message is initial, update its text to the new language
        return [{ ...prev[0], text: t('assistant_welcome') }, ...prev.slice(1)];
      }
      // If the first message is not initial, prepend the welcome message in the new language
      return [{ ...INITIAL_MESSAGES[0], text: t('assistant_welcome') }, ...prev];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Remove all pickers and toggles from main view

  // Only use Quran as source for now
  const speechLang = 'en-US';
  const ttsEnabled = false;
  const selectedVoice = null;

  // Ensure these handlers are defined here
  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        alert('Selected file: ' + result.assets[0].uri);
      }
    } catch (e) {
      alert('Error picking file');
    }
  };

  const handleVoiceInput = async () => {
    if (listening) {
      await stop();
    } else {
      await start(i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'nl' ? 'nl-NL' : 'en-US');
    }
  };

  const handleSpeak = (text: string) => {
    let lang = 'en-US';
    if (i18n.language === 'tr') lang = 'tr-TR';
    else if (i18n.language === 'nl') lang = 'nl-NL';
    Speech.speak(text, { language: lang });
  };

  // Update input when voice recognition result comes in
  React.useEffect(() => {
    if (voiceResults && voiceResults[0]) {
      setInput(voiceResults[0]);
    }
  }, [voiceResults]);

  const GOODBYE_PATTERNS = [
    /\bbye\b/i,
    /\bgoodbye\b/i,
    /\bsee you\b/i,
    /\bfarewell\b/i,
    /\bma'a salama\b/i,
    /\bgüle güle\b/i,
    /\bhoşça kal\b/i,
    /\bselam\b/i,
    /\btot ziens\b/i,
    /\bvaarwel\b/i,
    /\bdag\b/i,
    /\bdoei\b/i,
    /\bpeace\b/i
  ];

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    if (!groqApiKey) {
      // Optionally, show a toast or error, but do not auto-open modal
      return;
    }
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input.trim(),
      isInitial: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    Keyboard.dismiss();

    // Goodbye detection
    const isGoodbye = GOODBYE_PATTERNS.some((pattern) => pattern.test(userMessage.text));
    if (isGoodbye) {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: t('assistant_goodbye'),
        isInitial: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    let aiMessageText = '';
    try {
      let chatHistory = [];
      if (rememberChat) {
        // Send all previous messages (user/ai) as chat history
        chatHistory = messages
          .filter(m => !m.isInitial)
          .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
        chatHistory.push({ role: 'user', content: userMessage.text });
      } else {
        // Only send the latest user message
        chatHistory = [{ role: 'user', content: userMessage.text }];
      }
      aiMessageText = await askGroq(userMessage.text, groqApiKey);
      // Remove <think>...</think> tags from the AI response
      aiMessageText = aiMessageText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } catch (err: any) {
      aiMessageText = err.message || 'An error occurred.';
    }
    const aiMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: aiMessageText,
      isInitial: false,
    };
    setMessages((prev) => [...prev, aiMessage]);
    setSending(false);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderAvatar = (sender: string, aiText?: string) => {
    if (sender === 'ai') {
      return (
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => aiText && handleSpeak(aiText)}
            style={[
              styles.avatarCircle,
              {
                marginBottom: 16, // doubled space (avatarCircle default margin is 4-8)
                backgroundColor: Colors[colorScheme].surface,
                borderColor: Colors[colorScheme].primary,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="volume-high-outline" size={22} color={Colors[colorScheme].primary} />
          </TouchableOpacity>
          <View style={[styles.avatarCircle, { backgroundColor: Colors[colorScheme].surface, borderColor: Colors[colorScheme].primary }] }>
            <Ionicons name="chatbubbles" size={22} color={Colors[colorScheme].primary} />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.avatarCircle, { backgroundColor: '#10B981', borderColor: '#10B981' }] }>
        <Ionicons name="person" size={22} color="#fff" />
      </View>
    );
  };

  const renderItem = ({ item }: any) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && renderAvatar('ai', item.text)}
        <ThemedView
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.aiBubble,
          ]}
        >
          {isUser ? (
            <ThemedText style={{ color: isUser ? '#fff' : '#222' }}>{item.text}</ThemedText>
          ) : (
            <Markdown
              style={{ body: { color: '#222', fontSize: 16, lineHeight: 24 } }}
            >
              {formatSurahAyatMessage({ text: item.text, language: i18n.language, t })}
            </Markdown>
          )}
        </ThemedView>
        {isUser && renderAvatar('user')}
      </View>
    );
  };

  // Add a modal or prompt for API key
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <TouchableOpacity style={{ position: 'absolute', left: 16, top: 16, zIndex: 2 }} onPress={() => { setPendingRemember(rememberChat); setShowRememberModal(true); }}>
          <Ionicons name="analytics-outline" size={26} color={Colors[colorScheme].primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28, marginHorizontal: 56, textAlign: 'center', flex: 1 }}>{t('quranic_ai')}</ThemedText>
        <View style={{ flexDirection: 'row', position: 'absolute', right: 16, top: 16, zIndex: 2 }}>
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setMessages([
            { ...INITIAL_MESSAGES[0], text: t('assistant_welcome') }
          ])}>
            <Ionicons name="trash-outline" size={26} color={Colors[colorScheme].primary} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Remember Chat Modal */}
      {showRememberModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: Colors[colorScheme].primary }}>{t('conversation_memory')}</ThemedText>
            <ThemedText style={{ color: '#374151', fontSize: 15, textAlign: 'center', marginBottom: 16 }}>{t('memory_explanation')}</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <ThemedText style={{ fontSize: 16, marginRight: 10, color: Colors[colorScheme].primary }}>{t('remember_chat')}</ThemedText>
              <Switch
                value={pendingRemember}
                onValueChange={setPendingRemember}
                thumbColor={pendingRemember ? Colors[colorScheme].primary : '#ccc'}
                trackColor={{ true: Colors[colorScheme].primary, false: '#ccc' }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: Colors[colorScheme].primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                onPress={() => { setRememberChat(pendingRemember); setShowRememberModal(false); }}
              >
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('save')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                onPress={() => setShowRememberModal(false)}
              >
                <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16 }}>{t('cancel')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* API Key Prompt Modal */}
      {showApiKeyPrompt && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' }}>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: Colors[colorScheme].primary }}>{t('enter_groq_api_key')}</ThemedText>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, width: '100%', marginBottom: 16, fontSize: 16 }}
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
                  setShowApiKeyPrompt(false);
                  setTempApiKey('');
                  setShowingMasked(true);
                }}
              >
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('save')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                onPress={() => {
                  setShowApiKeyPrompt(false);
                  setTempApiKey('');
                  setShowingMasked(true);
                }}
              >
                <ThemedText style={{ color: Colors[colorScheme].primary, fontWeight: 'bold', fontSize: 16 }}>{t('cancel')}</ThemedText>
              </TouchableOpacity>
              {groqApiKey && (
                <TouchableOpacity
                  style={{ backgroundColor: '#f87171', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}
                  onPress={async () => {
                    await deleteGroqToken();
                    setGroqApiKey(null);
                    setTempApiKey('');
                    setShowApiKeyPrompt(false);
                    setShowingMasked(true);
                  }}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('remove_api_key')}</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 0, backgroundColor: Colors[colorScheme].background }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            undefined
          }
          ListFooterComponent={sending ? (
            <View style={[styles.messageRow, styles.aiRow]}>
              {renderAvatar('ai')}
              <ThemedView style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.loadingDotsContainer}>
                  <View style={[styles.loadingDot, styles.loadingDot1]} />
                  <View style={[styles.loadingDot, styles.loadingDot2]} />
                  <View style={[styles.loadingDot, styles.loadingDot3]} />
                </View>
              </ThemedView>
            </View>
          ) : null}
        />
        <View style={[styles.inputBarWrapper, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.plusButton} onPress={handlePickFile}>
              <Ionicons name="add" size={26} color="#2563eb" />
            </TouchableOpacity>
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={t('type_message_placeholder')}
                placeholderTextColor="#aaa"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                editable={!sending}
                maxLength={500}
                returnKeyType="send"
                multiline
                numberOfLines={3}
              />
              {listening && (
                <ThemedText style={{ color: '#2563eb', fontSize: 13, marginTop: 2 }}>
                  {partial ? `"${partial}"` : t('listening')}
                </ThemedText>
              )}
            </View>
            <TouchableOpacity style={styles.micButton} onPress={handleVoiceInput}>
              <Ionicons name={listening ? "mic-circle" : "mic"} size={22} color={listening ? "#2563eb" : "#10B981"} />
              {listening && <ThemedText style={{ color: '#2563eb', fontSize: 12, marginLeft: 4 }}>●</ThemedText>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: input.trim() && !sending ? '#10B981' : '#ccc' }]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: '#f7f7f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  chatList: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#f7f7f8',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    maxWidth: '100%',
  },
  userRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    minWidth: 60,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#f3f4f6',
    borderColor: '#ececec',
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#ececec',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  inputBarWrapper: {
    backgroundColor: '#f7f7f8',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  textInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececec',
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#222',
    backgroundColor: 'transparent',
    minHeight: 44,
    maxHeight: 80, // about 3 lines
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginHorizontal: 2,
    opacity: 0.7,
    // Animate with keyframes if desired
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: 36,
    padding: 4,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    backgroundColor: '#f3f4f6',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    backgroundColor: '#f3f4f6',
  },
  // Loading dots animation (add keyframes if using Animated API)
  loadingDot1: {
    opacity: 0.7,
    transform: [{ scale: 1 }],
  },
  loadingDot2: {
    opacity: 0.5,
    transform: [{ scale: 0.8 }],
  },
  loadingDot3: {
    opacity: 0.3,
    transform: [{ scale: 0.6 }],
  },
}); 