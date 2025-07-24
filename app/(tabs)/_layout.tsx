import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
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
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('calendar'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />, // Calendar tab
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t('prayer'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock" color={color} />, // Prayer tab
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('qibla'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.north" color={color} />,
        }}
      />
      <Tabs.Screen
        name="masjids"
        options={{
          title: t('masjids'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="mappin" color={color} />,
        }}
      />
    </Tabs>
  );
}
