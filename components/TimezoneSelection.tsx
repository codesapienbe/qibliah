import { Colors } from '@/constants/Colors';
import { MOCK_LOCATIONS } from '@/constants/MockLocations';
import { SUPPORTED_TIMEZONES, SupportedTimezone } from '@/constants/Timezones';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface TimezoneSelectionProps {
  onTimezoneSelected: (timezone: SupportedTimezone, location?: { lat: number; lng: number }) => void;
}

export default function TimezoneSelection({ onTimezoneSelected }: TimezoneSelectionProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const [selectedTimezone, setSelectedTimezone] = useState<SupportedTimezone | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleTimezoneSelect = (tz: SupportedTimezone) => {
    setSelectedTimezone(tz);
  };

  const handleLocationSelect = (locId: string) => {
    setSelectedLocation(locId);
  };

  const handleContinue = () => {
    if (selectedTimezone) {
      const location = selectedLocation 
        ? MOCK_LOCATIONS.find(loc => loc.id === selectedLocation)
        : null;
      
      onTimezoneSelected(selectedTimezone, location ? { lat: location.lat, lng: location.lng } : undefined);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={[styles.title, { color: Colors[colorScheme].primary }]}>
          {t('welcome_to_qibliah', { defaultValue: 'Welcome to Qibliah' })}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          {t('setup_timezone_location', { defaultValue: 'Please select your timezone and location to get accurate prayer times' })}
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timezone Selection */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: Colors[colorScheme].secondary }]}>
            {t('select_timezone', { defaultValue: 'Select Timezone' })}
          </ThemedText>
          <View style={styles.timezoneGrid}>
            {SUPPORTED_TIMEZONES.map((tz) => (
              <Pressable
                key={tz}
                onPress={() => handleTimezoneSelect(tz)}
                style={[
                  styles.timezoneButton,
                  {
                    backgroundColor: selectedTimezone === tz 
                      ? Colors[colorScheme].primary 
                      : Colors[colorScheme].surface,
                    borderColor: Colors[colorScheme].cardBorder,
                  },
                ]}
              >
                <ThemedText 
                  style={[
                    styles.timezoneText,
                    { 
                      color: selectedTimezone === tz 
                        ? Colors[colorScheme].background 
                        : Colors[colorScheme].text 
                    }
                  ]}
                >
                  {tz}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: Colors[colorScheme].secondary }]}>
            {t('select_location', { defaultValue: 'Select Location (Optional)' })}
          </ThemedText>
          <View style={styles.locationList}>
            {MOCK_LOCATIONS.map((loc) => (
              <Pressable
                key={loc.id}
                onPress={() => handleLocationSelect(loc.id)}
                style={[
                  styles.locationButton,
                  {
                    backgroundColor: selectedLocation === loc.id 
                      ? Colors[colorScheme].primary 
                      : Colors[colorScheme].surface,
                    borderColor: Colors[colorScheme].cardBorder,
                  },
                ]}
              >
                <View>
                  <ThemedText 
                    style={[
                      styles.locationTitle,
                      { 
                        color: selectedLocation === loc.id 
                          ? Colors[colorScheme].background 
                          : Colors[colorScheme].text 
                      }
                    ]}
                  >
                    {loc.label}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.locationAddress,
                      { 
                        color: selectedLocation === loc.id 
                          ? Colors[colorScheme].background 
                          : Colors[colorScheme].info 
                      }
                    ]}
                  >
                    {loc.address}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedTimezone}
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedTimezone 
                ? Colors[colorScheme].primary 
                : Colors[colorScheme].surface,
              borderColor: Colors[colorScheme].cardBorder,
            },
          ]}
        >
          <ThemedText 
            style={[
              styles.continueText,
              { 
                color: selectedTimezone 
                  ? Colors[colorScheme].background 
                  : Colors[colorScheme].text 
              }
            ]}
          >
            {t('continue', { defaultValue: 'Continue' })}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timezoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timezoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  timezoneText: {
    fontSize: 14,
    textAlign: 'center',
  },
  locationList: {
    gap: 10,
  },
  locationButton: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
