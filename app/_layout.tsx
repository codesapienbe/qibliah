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
import Preloader from '@/components/Preloader';
import TimezoneSelection from '@/components/TimezoneSelection';

import { SupportedTimezone } from '@/constants/Timezones';
import { useColorScheme } from '@/hooks/useColorScheme';
import { configureNotificationSound, initNotifications } from '@/services/notifications';
import { logError } from '@/utils/logger';


import React from 'react';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });


  // App initialization states
  const [langReady, setLangReady] = React.useState(false);
  const [showPreloader, setShowPreloader] = React.useState(true);
  const [showTimezoneSelection, setShowTimezoneSelection] = React.useState(false);
  const [appReady, setAppReady] = React.useState(false);

  // Ensure language is set from storage before rendering
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
    // Configure custom notification sound file names if present in the app bundle
    // iOS expects the exact file name (with extension). Android channel prefers the resource name (without extension).
    configureNotificationSound({ iosFileName: 'adhan.wav', androidFileName: 'adhan' });
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

  const handlePreloaderComplete = React.useCallback(async (timezoneSelected: boolean) => {
    setShowPreloader(false);
    
    if (!timezoneSelected) {
      setShowTimezoneSelection(true);
    } else {
      setAppReady(true);
    }
  }, []);

  const handleTimezoneSelected = React.useCallback(async (
    timezone: SupportedTimezone, 
    location?: { lat: number; lng: number }
  ) => {
    try {
      // Store timezone
      await AsyncStorage.setItem('@prayer_selected_timezone_v1', timezone);
      
      // Store location if provided
      if (location) {
        await AsyncStorage.setItem('@manual_location', JSON.stringify(location));
      }
      
      setShowTimezoneSelection(false);
      setAppReady(true);
    } catch (error) {
      // Handle error if needed
      setShowTimezoneSelection(false);
      setAppReady(true);
    }
  }, []);

  if (!loaded || !langReady) {
    // Wait for fonts and language
    return null;
  }

  if (showPreloader) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <I18nextProvider i18n={i18n}>
            <Preloader onComplete={handlePreloaderComplete} />
          </I18nextProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  if (showTimezoneSelection) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <I18nextProvider i18n={i18n}>
            <TimezoneSelection onTimezoneSelected={handleTimezoneSelected} />
          </I18nextProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
