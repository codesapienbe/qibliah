import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import i18n from '../utils/i18n';

import ErrorBoundary from '@/components/ErrorBoundary';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import { initNotifications } from '@/services/notifications';
import { logError } from '@/utils/logger';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();

  // Ensure language is set from storage before rendering
  const [langReady, setLangReady] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const storedLang = await AsyncStorage.getItem('app_language');
      if (storedLang && storedLang !== i18n.language) {
        await i18n.changeLanguage(storedLang);
      }
      setLangReady(true);
    })();
  }, []);

  // Initialize notifications and set global error handler
  React.useEffect(() => {
    initNotifications().catch(() => {});

    try {
      const anyGlobal: any = global as any;
      if (anyGlobal?.ErrorUtils?.setGlobalHandler) {
        const previousHandler = anyGlobal.ErrorUtils.getGlobalHandler
          ? anyGlobal.ErrorUtils.getGlobalHandler()
          : null;
        anyGlobal.ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
          logError(err, isFatal ? 'GlobalErrorHandler:Fatal' : 'GlobalErrorHandler').catch(() => {});
          if (previousHandler) {
            try { previousHandler(err, isFatal); } catch {}
          }
        });
      }
    } catch {
      // best-effort only
    }
  }, []);

  if (!loaded || !langReady) {
    // Wait for fonts and language
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerTitle: () => (
                    <Image
                      source={require('../assets/images/icon.png')}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  ),
                  headerRight: () => (
                    <Ionicons
                      name="settings-outline"
                      size={26}
                      style={{ marginRight: 18 }}
                      color={Colors[colorScheme ?? 'light'].icon}
                      onPress={() => router.push('/settings')}
                    />
                  ),
                  headerShown: true,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
