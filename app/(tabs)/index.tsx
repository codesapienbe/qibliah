import { askOllama, searchQuran } from '@/api';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAssistantMessages } from '@/hooks/useAssistantMessages';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INITIAL_MESSAGES = [
  {
    id: 'ai-0',
    sender: 'ai',
    text: "Assalamu Alaikum! I am your Quranic AI assistant. I can help you understand verses from the Holy Quran. How can I assist you today?",
    isInitial: true,
  },
];

export default function HomeScreen() {
  const [messages, setMessages, messagesLoading] = useAssistantMessages(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

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
    alert('Voice input not implemented yet.');
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
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
    let aiMessageText = '';
    let usedFallback = false;
    try {
      // Try Quran API first
      const result = await searchQuran(userMessage.text, 'en');
      if (result && result.data && result.data.matches && result.data.matches.length > 0) {
        aiMessageText = result.data.matches.map((m: any) => `${m.text} (Surah ${m.surah.number}:${m.numberInSurah})`).join('\n\n');
      } else {
        // Fallback to Ollama if no relevant verses
        aiMessageText = await askOllama(userMessage.text);
        usedFallback = true;
      }
    } catch (err: any) {
      // Quran API failed, fallback to Ollama
      try {
        aiMessageText = await askOllama(userMessage.text);
        usedFallback = true;
      } catch (ollamaErr: any) {
        aiMessageText = ollamaErr.message || 'An error occurred.';
      }
    }
    if (!aiMessageText) {
      aiMessageText = usedFallback ? 'No response from Ollama.' : 'No relevant Quranic verses found.';
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

  const renderAvatar = (sender: string) => {
    if (sender === 'ai') {
      return (
        <View style={styles.avatarCircle}>
          <Ionicons name="chatbubbles" size={22} color="#10B981" />
        </View>
      );
    }
    return (
      <View style={[styles.avatarCircle, { backgroundColor: '#2563eb' }] }>
        <Ionicons name="person" size={22} color="#fff" />
      </View>
    );
  };

  const renderItem = ({ item }: any) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && renderAvatar('ai')}
        <ThemedView
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.aiBubble,
          ]}
        >
          <ThemedText style={{ color: isUser ? '#fff' : '#222' }}>{item.text}</ThemedText>
        </ThemedView>
        {isUser && renderAvatar('user')}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f8' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={12}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
            {/* Header */}
            <View style={styles.header}>
              <Image source={require('@/assets/images/icon.png')} style={styles.headerLogo} />
              <ThemedText style={styles.headerTitle}>Quranic AI</ThemedText>
              <TouchableOpacity style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={24} color="#222" />
              </TouchableOpacity>
            </View>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
                    placeholder="Type your message..."
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
                </View>
                <TouchableOpacity style={styles.micButton} onPress={handleVoiceInput}>
                  <Ionicons name="mic" size={22} color="#10B981" />
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
          </View>
        </TouchableWithoutFeedback>
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
    backgroundColor: 'linear-gradient(90deg, #10B981 0%, #2563eb 100%)', // fallback for RN: use blue/green
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