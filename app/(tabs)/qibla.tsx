import React from 'react';

import KaabaIcon from '@/components/KaabaIcon';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocation } from '@/hooks/useLocation';
import { useQiblaDirection } from '@/hooks/useQiblaDirection';
import { calculateQibla, haversineDistance } from '@/utils/qibla';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COMPASS_SIZE = 240;

// Real Kaaba coordinates
const KAABA = {
  lat: 21.4225,
  lng: 39.8262
};

export default function QiblaTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const {
    location,
    errorMsg: locationError,
    loading: locationLoading,
    refreshLocation,
    requestPermission: requestLocationPermission,
    getCurrentLocation,
    permissionDenied,
    setManualLocation,
  } = useLocation();
  const {
    heading,
    errorMsg: compassError,
    loading: compassLoading,
    requestPermission: requestCompassPermission,
    startCompass,
    stopCompass,
  } = useQiblaDirection();
  const [manualLat, setManualLat] = React.useState('');
  const [manualLng, setManualLng] = React.useState('');
  const [manualError, setManualError] = React.useState('');

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        const locGranted = await requestLocationPermission();
        if (locGranted && isActive) {
          await getCurrentLocation();
        }
        const compassGranted = await requestCompassPermission();
        if (compassGranted && isActive) {
          startCompass();
        }
      })();
      return () => {
        isActive = false;
        stopCompass();
      };
    }, [requestLocationPermission, getCurrentLocation, requestCompassPermission, startCompass, stopCompass])
  );

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setManualError(t('qibla_invalid_latlng'));
      return;
    }
    setManualError('');
    setManualLocation({ lat, lng });
  };

  // Debug logging
  React.useEffect(() => {
    if (heading !== null) {
      console.log('Compass - Heading:', heading, '°');
    }
  }, [heading]);

  React.useEffect(() => {
    if (location) {
      console.log('Current location:', location);
      console.log('Expected Zele coords: ~51.0333°N, 4.0667°E');
    }
  }, [location]);

  // Only calculate when we have real location data
  let qiblaDegrees: number | null = null;
  let distance: string | null = null;
  let coordsStr: string | null = null;
  
  if (location) {
    qiblaDegrees = Math.round(calculateQibla(location.lat, location.lng, KAABA.lat, KAABA.lng));
    distance = `${Math.round(haversineDistance(location.lat, location.lng, KAABA.lat, KAABA.lng))} km`;
    coordsStr = `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`;
  }

  // Compass rotation: keep North pointing up
  const compassRotation = heading != null ? -heading : 0;
  
  // Calculate Kaaba icon position on compass circle
  let kaabaX = COMPASS_SIZE / 2 - 16; // Default center position
  let kaabaY = COMPASS_SIZE / 2 - 16;
  let isNearQibla = false;
  
  if (qiblaDegrees !== null && heading !== null) {
    // Calculate the Kaaba position relative to the compass
    const kaabaAngleFromNorth = qiblaDegrees;
    const kaabaRadians = (kaabaAngleFromNorth * Math.PI) / 180;
    const compassRadius = (COMPASS_SIZE - 60) / 2; // Account for border and icon size
    
    // Position on compass circle
    kaabaX = COMPASS_SIZE / 2 + compassRadius * Math.sin(kaabaRadians) - 16;
    kaabaY = COMPASS_SIZE / 2 - compassRadius * Math.cos(kaabaRadians) - 16;
    
    // Check if user is facing Qibla direction (within 15 degrees tolerance)
    const angleDiff = Math.abs(((heading - qiblaDegrees + 540) % 360) - 180);
    isNearQibla = angleDiff < 15;
  }
  
  const kaabaIconSize = isNearQibla ? 64 : 32; // 2x larger when near Qibla

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      {permissionDenied && !location ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28, marginBottom: 16 }}>
            {t('qibla_enter_location')}
          </ThemedText>
          <TextInput
            style={{ borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, borderRadius: 8, padding: 10, width: 220, marginBottom: 12, color: Colors[colorScheme].text }}
            placeholder={t('qibla_latitude_placeholder')}
            placeholderTextColor={Colors[colorScheme].text}
            value={manualLat}
            onChangeText={setManualLat}
            keyboardType="numeric"
          />
          <TextInput
            style={{ borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, borderRadius: 8, padding: 10, width: 220, marginBottom: 12, color: Colors[colorScheme].text }}
            placeholder={t('qibla_longitude_placeholder')}
            placeholderTextColor={Colors[colorScheme].text}
            value={manualLng}
            onChangeText={setManualLng}
            keyboardType="numeric"
          />
          {manualError ? <Text style={{ color: Colors[colorScheme].error, marginBottom: 8 }}>{manualError}</Text> : null}
          <TouchableOpacity
            onPress={handleManualLocationSubmit}
            style={{
              backgroundColor: Colors[colorScheme].primary,
              borderRadius: 8,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              alignSelf: 'center',
              marginBottom: 8,
            }}
            accessibilityLabel={t('qibla_submit_manual_location')}
          >
            <Ionicons name="checkmark-circle" size={28} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
          <Text style={{ color: Colors[colorScheme].text, marginTop: 20, textAlign: 'center', fontSize: 13 }}>
            {t('qibla_location_permission_info', { defaultValue: 'Location permission required for automatic detection.' })}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 0, backgroundColor: Colors[colorScheme].background }}>
            {/* Compass & Info */}
            <View style={styles.compassContainer}>
              <View style={styles.compassWrapper}>
                {/* Rotating compass face (N/E/S/W) */}
                <View
                  style={[
                    styles.compassCircle,
                    { 
                      borderColor: Colors[colorScheme].cardBorder, 
                      backgroundColor: Colors[colorScheme].surface,
                      transform: [{ rotate: `${compassRotation}deg` }] 
                    },
                  ]}
                >
                  {/* Compass Markings */}
                  <View style={styles.compassMarkings}>
                    <ThemedText style={[styles.compassMark, styles.north, { color: Colors[colorScheme].primary }]}>{t('north_short')}</ThemedText>
                    <ThemedText style={[styles.compassMark, styles.east, { color: Colors[colorScheme].text }]}>{t('east_short')}</ThemedText>
                    <ThemedText style={[styles.compassMark, styles.south, { color: Colors[colorScheme].text }]}>{t('south_short')}</ThemedText>
                    <ThemedText style={[styles.compassMark, styles.west, { color: Colors[colorScheme].text }]}>{t('west_short')}</ThemedText>
                  </View>
                  
                  {/* Center dot */}
                  <View style={[styles.compassCenter, { 
                    borderColor: Colors[colorScheme].primary, 
                    backgroundColor: Colors[colorScheme].background 
                  }]} />
                  
                  {/* Kaaba icon positioned at Qibla direction */}
                  {qiblaDegrees !== null && (
                    <View 
                      style={[
                        styles.kaabaIconOnCompass,
                        {
                          left: kaabaX,
                          top: kaabaY,
                          width: kaabaIconSize,
                          height: kaabaIconSize,
                        }
                      ]}
                    >
                      <View style={isNearQibla ? [styles.kaabaIconHighlight, { shadowColor: Colors[colorScheme].primary }] : undefined}>
                        <KaabaIcon size={kaabaIconSize} />
                      </View>
                    </View>
                  )}
                </View>
                
                {/* Static needle pointing up (shows device heading) */}
                <View style={[styles.staticNeedle, { 
                  backgroundColor: isNearQibla ? Colors[colorScheme].primary : Colors[colorScheme].secondary
                }]} />

                {/* Error/loading overlay */}
                {(compassLoading || compassError || (!compassLoading && !compassError && heading === null)) && (
                  <View style={styles.overlayMessage}>
                    {compassLoading && <ActivityIndicator size="small" color={Colors[colorScheme].primary} />}
                    {compassError && (
                      <ThemedText style={{ color: Colors[colorScheme].error, textAlign: 'center', fontSize: 12 }}>
                        {compassError}
                      </ThemedText>
                    )}
                    {!compassLoading && !compassError && heading === null && (
                      <ThemedText style={{ color: Colors[colorScheme].error, textAlign: 'center', fontSize: 12 }}>
                        {t('qibla_compass_unavailable')}
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
              
              {/* Direction Info */}
              <View style={styles.qiblaInfo}>
                <ThemedText style={[styles.directionLabel, { color: Colors[colorScheme].text }]}>
                  {t('qibla_direction')}
                </ThemedText>
                {qiblaDegrees !== null ? (
                  <>
                    <ThemedText style={[
                      styles.directionValue, 
                      { color: isNearQibla ? Colors[colorScheme].primary : Colors[colorScheme].secondary }
                    ]}>
                      <Text>{qiblaDegrees !== null ? qiblaDegrees : ''}</Text>
                      <Text style={{fontSize: 32}}>°</Text>
                    </ThemedText>
                    {isNearQibla && (
                      <ThemedText style={[styles.alignedText, { color: Colors[colorScheme].primary }]}>
                        {t('qibla_facing_qibla')}
                      </ThemedText>
                    )}
                    {/* accuracy && (
                      <ThemedText style={{ color: Colors[colorScheme].text, fontSize: 12, marginTop: 4 }}>
                        {t('qibla_accuracy', { value: accuracy.toFixed(1) })}
                      </ThemedText>
                    ) */}
                  </>
                ) : (
                  <ThemedText style={{ color: Colors[colorScheme].error, fontSize: 16 }}>
                    {t('qibla_waiting_for_location')}
                  </ThemedText>
                )}
              </View>
            </View>
            
            {/* Location Details Card */}
            <ThemedView style={[styles.locationCard, { 
              backgroundColor: Colors[colorScheme].surface, 
              borderColor: Colors[colorScheme].cardBorder 
            }]}>
              {locationLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="small" color={Colors[colorScheme].primary} />
                  <ThemedText style={{ marginTop: 8, color: Colors[colorScheme].text }}>
                    {t('qibla_getting_location')}
                  </ThemedText>
                </View>
              ) : locationError ? (
                <View style={styles.centerContent}>
                  <ThemedText style={{ color: Colors[colorScheme].error, textAlign: 'center', marginBottom: 10 }}>
                    {locationError}
                  </ThemedText>
                  <TouchableOpacity 
                    onPress={refreshLocation}
                    style={[styles.refreshButton, { backgroundColor: Colors[colorScheme].primary }]}
                  >
                    <ThemedText style={{ color: Colors[colorScheme].icon, fontWeight: 'bold' }}>{t('try_again')}</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : location ? (
                <>
                  <View style={[styles.locationRow, { borderBottomColor: Colors[colorScheme].cardBorder }]}>
                    <ThemedText style={{ color: Colors[colorScheme].text }}>{t('qibla_your_location')}:</ThemedText>
                    <ThemedText style={{ color: Colors[colorScheme].text, fontFamily: 'monospace' }}>
                      {coordsStr ? <Text>{coordsStr}</Text> : coordsStr !== null ? <Text>{coordsStr}</Text> : <Text />}
                    </ThemedText>
                  </View>
                  <View style={[styles.locationRow, { borderBottomColor: Colors[colorScheme].cardBorder }]}>
                    <ThemedText style={{ color: Colors[colorScheme].text }}>{t('qibla_distance_to_mecca')}:</ThemedText>
                    <ThemedText style={{ color: Colors[colorScheme].text, fontWeight: 'bold' }}>
                      {distance ? <Text>{distance}</Text> : distance !== null ? <Text>{distance}</Text> : <Text />}
                    </ThemedText>
                  </View>
                  <View style={[styles.locationRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={{ color: Colors[colorScheme].text }}>{t('qibla_kaaba_mecca')}:</ThemedText>
                    <ThemedText style={{ color: Colors[colorScheme].text, fontFamily: 'monospace' }}>
                      <Text>{KAABA.lat.toFixed(4)}</Text>
                      <Text style={{fontSize: 14}}>°N, </Text>
                      <Text>{KAABA.lng.toFixed(4)}</Text>
                      <Text style={{fontSize: 14}}>°E</Text>
                    </ThemedText>
                  </View>
                </>
              ) : (
                <View style={styles.centerContent}>
                  <ThemedText style={{ color: Colors[colorScheme].error }}>
                    {t('qibla_location_not_available')}
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  compassContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'relative',
  },
  compassCircle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  compassMarkings: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassMark: {
    position: 'absolute',
    fontWeight: 'bold',
    fontSize: 20,
  },
  north: {
    top: 12,
    left: '50%',
    marginLeft: -10,
  },
  east: {
    right: 12,
    top: '50%',
    marginTop: -12,
  },
  south: {
    bottom: 12,
    left: '50%',
    marginLeft: -10,
  },
  west: {
    left: 12,
    top: '50%',
    marginTop: -12,
  },
  compassCenter: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - 8,
    left: COMPASS_SIZE / 2 - 8,
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 8,
    zIndex: 3,
  },
  staticNeedle: {
    position: 'absolute',
    top: 0,
    left: COMPASS_SIZE / 2 - 2,
    width: 4,
    height: COMPASS_SIZE / 2 - 20,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    zIndex: 5,
  },
  overlayMessage: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  qiblaInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  directionLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  directionValue: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  alignedText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  locationCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  centerContent: {
    alignItems: 'center',
    padding: 16,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  kaabaIconOnCompass: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  kaabaIconHighlight: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 16,
  },
});
