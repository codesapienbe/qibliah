import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, DeviceEventEmitter, Platform, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingRight: 12 }} accessibilityLabel={t('settings')}>
            <Ionicons name="settings-outline" size={22} color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
        ),
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('clear_chat_title', { defaultValue: 'Clear chat?' }),
                  t('clear_chat_message', { defaultValue: 'This will remove the conversation.' }),
                  [
                    { text: t('cancel'), style: 'cancel' as const },
                    {
                      text: t('clear', { defaultValue: 'Clear' }),
                      style: 'destructive' as const,
                      onPress: () => DeviceEventEmitter.emit('CLEAR_CHAT'),
                    },
                  ]
                );
              }}
              style={{ paddingLeft: 12 }}
              accessibilityLabel={t('clear')}
            >
              <Ionicons name="trash-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('calendar'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />, // Calendar tab
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => DeviceEventEmitter.emit('CALENDAR_SOTD')}
              style={{ paddingLeft: 12 }}
              accessibilityLabel={t('surah_of_the_day', { defaultValue: 'Surah of the Day' })}
            >
              <Ionicons name="book-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          ),
        }}
      />
      {/* New Prayer tab */}
      <Tabs.Screen
        name="prayer"
        options={{
          title: t('prayer'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hands.sparkles" color={color} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => DeviceEventEmitter.emit('PRAYER_COACH_INFO')}
              style={{ paddingLeft: 12 }}
              accessibilityLabel={t('prayer_coach_info', { defaultValue: 'Prayer coach info' })}
            >
              <Ionicons name="information-circle-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('qibla'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.north" color={color} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => DeviceEventEmitter.emit('QIBLA_INFO')}
              style={{ paddingLeft: 12 }}
              accessibilityLabel={t('qibla_info', { defaultValue: 'Qibla info' })}
            >
              <Ionicons name="information-circle-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="masjids"
        options={{
          title: t('masjids'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="mappin" color={color} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => DeviceEventEmitter.emit('MASJIDS_LOCATE')}
              style={{ paddingLeft: 12 }}
              accessibilityLabel={t('locate_me', { defaultValue: 'Locate me' })}
            >
              <Ionicons name="locate-outline" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
