import React from 'react';

import KaabaIcon from '@/components/KaabaIcon';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TimezoneSelection from '@/components/TimezoneSelection';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocation } from '@/hooks/useLocation';
import { useQiblaDirection } from '@/hooks/useQiblaDirection';
import { calculateQibla, haversineDistance } from '@/utils/qibla';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCALE = 0.8;
const COMPASS_SIZE = Math.round(240 * SCALE);

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
    loading: locationLoading,
    requestPermission: requestLocationPermission,
    getCurrentLocation,
    permissionDenied: locationPermissionDenied,
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
  const windowHeight = Dimensions.get('window').height;
  const mapHeight = Math.round(windowHeight * 0.33 * SCALE * 0.8);
  const [showSetup, setShowSetup] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        const locGranted = await requestLocationPermission();
        if (locGranted && isActive) {
          await getCurrentLocation();
          setShowSetup(false);
        } else if (!locGranted && isActive) {
          setShowSetup(true);
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
  const handleLocate = React.useCallback(async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      await getCurrentLocation();
      setShowSetup(false);
    } else {
      setShowSetup(true);
    }
  }, [requestLocationPermission, getCurrentLocation]);

  // Debug logging removed per request

  // Only calculate when we have real location data
  let qiblaDegrees: number | null = null;
  let distance: string | null = null;
  let coordsStr: string | null = null;
  let userLatLng: { latitude: number; longitude: number } | null = null;
  const kaabaLatLng = { latitude: KAABA.lat, longitude: KAABA.lng };
  
  if (location) {
    qiblaDegrees = Math.round(calculateQibla(location.lat, location.lng, KAABA.lat, KAABA.lng));
    distance = `${Math.round(haversineDistance(location.lat, location.lng, KAABA.lat, KAABA.lng))} km`;
    coordsStr = `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`;
    userLatLng = { latitude: location.lat, longitude: location.lng };
  }

  // Compass rotation: keep North pointing up
  const compassRotation = heading != null ? -heading : 0;
  
  // Calculate Kaaba icon position around the compass (just outside the circle)
  let kaabaX = COMPASS_SIZE / 2 - Math.round(16 * SCALE); // Default center position
  let kaabaY = COMPASS_SIZE / 2 - Math.round(16 * SCALE);
  let isNearQibla = false;
  
  if (qiblaDegrees !== null) {
    // Place Kaaba marker relative to North only, independent of current heading
    const kaabaAngleFromNorth = qiblaDegrees;
    const kaabaRadians = (kaabaAngleFromNorth * Math.PI) / 180;
    const iconHalf = Math.round(16 * SCALE);
    const marginOutside = Math.round(16 * SCALE);
    const outsideRadius = COMPASS_SIZE / 2 + marginOutside; // push outside the circle

    kaabaX = COMPASS_SIZE / 2 + outsideRadius * Math.sin(kaabaRadians) - iconHalf;
    kaabaY = COMPASS_SIZE / 2 - outsideRadius * Math.cos(kaabaRadians) - iconHalf;

    // If we have heading, show near-Qibla highlight
    if (heading !== null) {
      const angleDiff = Math.abs(((heading - qiblaDegrees + 540) % 360) - 180);
      isNearQibla = angleDiff < 15;
    }
  }
  
  const kaabaIconSize = Math.round((isNearQibla ? 64 : 32) * SCALE); // 2x larger when near Qibla

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background, paddingTop: 6 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 0, backgroundColor: Colors[colorScheme].background, paddingBottom: 80 }}>
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
                  
                  {/* Kaaba icon positioned relative to North (stable) */}
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
              
              {/* Direction Info moved into details table below */}
            </View>

            {/* MapView: shows path and distance between User and Kaaba */}
            <View style={{ height: mapHeight, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, backgroundColor: Colors[colorScheme].surface }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: userLatLng ? (userLatLng.latitude + kaabaLatLng.latitude) / 2 : kaabaLatLng.latitude,
                  longitude: userLatLng ? (userLatLng.longitude + kaabaLatLng.longitude) / 2 : kaabaLatLng.longitude,
                  latitudeDelta: userLatLng ? Math.max(20, Math.abs(userLatLng.latitude - kaabaLatLng.latitude) * 2) : 20,
                  longitudeDelta: userLatLng ? Math.max(20, Math.abs(userLatLng.longitude - kaabaLatLng.longitude) * 2) : 20,
                }}
                showsCompass={false}
                showsBuildings={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {/* Kaaba Marker */}
                <Marker coordinate={kaabaLatLng} anchor={{ x: 0.5, y: 0.9 }}>
                  <View style={{ padding: Math.round(6 * SCALE), backgroundColor: Colors[colorScheme].surface, borderRadius: Math.round(12 * SCALE), borderWidth: 1, borderColor: Colors[colorScheme].cardBorder }}>
                    <KaabaIcon size={Math.round(22 * SCALE)} />
                  </View>
                </Marker>
                {/* User Marker */}
                {userLatLng && (
                  <Marker coordinate={userLatLng} anchor={{ x: 0.5, y: 0.9 }}>
                    <View style={{ padding: Math.round(6 * SCALE), backgroundColor: Colors[colorScheme].surface, borderRadius: Math.round(12 * SCALE), borderWidth: 1, borderColor: Colors[colorScheme].cardBorder }}>
                      <Ionicons name="home" size={Math.round(20 * SCALE)} color={Colors[colorScheme].primary} />
                    </View>
                  </Marker>
                )}
                {/* Line and distance label */}
                {userLatLng && (
                  <>
                    <Polyline
                      coordinates={[userLatLng, kaabaLatLng]}
                      geodesic
                      strokeColor={Colors[colorScheme].primary}
                      strokeWidth={Math.max(2, Math.round(3 * SCALE))}
                    />
                    {/* Distance label at midpoint */}
                    <Marker
                      coordinate={{
                        latitude: (userLatLng.latitude + kaabaLatLng.latitude) / 2,
                        longitude: (userLatLng.longitude + kaabaLatLng.longitude) / 2,
                      }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={{ paddingVertical: Math.round(6 * SCALE), paddingHorizontal: Math.round(10 * SCALE), backgroundColor: Colors[colorScheme].surface, borderRadius: Math.round(12 * SCALE), borderWidth: 1, borderColor: Colors[colorScheme].cardBorder, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                        <ThemedText style={{ color: Colors[colorScheme].text, fontWeight: 'bold' }}>{distance}</ThemedText>
                      </View>
                    </Marker>
                  </>
                )}
              </MapView>
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
              ) : location ? (
                <>
                  {/* Qibla Direction Row */}
                  <View style={[styles.locationRow, { borderBottomColor: Colors[colorScheme].cardBorder }]}> 
                    <ThemedText style={{ color: Colors[colorScheme].text }}>{t('qibla_direction')}:</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <ThemedText style={{ color: isNearQibla ? Colors[colorScheme].primary : Colors[colorScheme].secondary, fontWeight: 'bold' }}>
                        {qiblaDegrees !== null ? qiblaDegrees : '—'}
                      </ThemedText>
                      <ThemedText style={{ color: isNearQibla ? Colors[colorScheme].primary : Colors[colorScheme].secondary, marginLeft: 2 }}>°</ThemedText>
                    </View>
                  </View>
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
                  {/* Intentionally no error message to keep UI clean */}
                </View>
              )}
            </ThemedView>
      </ScrollView>

      {/* Floating locate button */}
      <TouchableOpacity
        onPress={handleLocate}
        style={{ position: 'absolute', right: Math.round(20 * SCALE), bottom: Math.round(24 * SCALE), width: Math.round(56 * SCALE), height: Math.round(56 * SCALE), borderRadius: Math.round(28 * SCALE), backgroundColor: Colors[colorScheme].primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}
        accessibilityLabel={t('qibla_submit_manual_location')}
      >
        <Ionicons name="locate" size={Math.round(26 * SCALE)} color={Colors[colorScheme].icon} />
      </TouchableOpacity>

      {(showSetup || locationPermissionDenied) && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ flex: 1 }}>
            <TimezoneSelection
              onTimezoneSelected={(_tz, loc) => {
                if (loc) {
                  setManualLocation(loc);
                }
                setShowSetup(false);
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Scaled style values
const FONT_COMPASS_MARK = Math.round(20 * SCALE);
const FONT_DIRECTION_LABEL = Math.round(16 * SCALE);
const FONT_DIRECTION_VALUE = Math.round(48 * SCALE);
const FONT_ALIGNED_TEXT = Math.round(16 * SCALE);
const COMPASS_CENTER_SIZE = Math.round(16 * SCALE);
const COMPASS_BORDER_WIDTH = Math.max(1, Math.round(4 * SCALE));
const COMPASS_PADDING_VERTICAL = Math.round(20 * SCALE);
const MARGIN_TOP_QIBLA_INFO = Math.round(24 * SCALE);
const NEEDLE_WIDTH = Math.max(2, Math.round(4 * SCALE));
const NEEDLE_HEIGHT = Math.round(COMPASS_SIZE / 2 - 20 * SCALE);
const NEEDLE_RADIUS = Math.max(1, Math.round(2 * SCALE));
const LOCATION_CARD_MARGIN_TOP = Math.round(20 * SCALE);
const LOCATION_CARD_RADIUS = Math.round(16 * SCALE);
const LOCATION_CARD_PADDING = Math.round(20 * SCALE);
const LOCATION_ROW_PADDING_VERTICAL = Math.round(8 * SCALE);
const CENTER_CONTENT_PADDING = Math.round(16 * SCALE);
const ALIGNED_TEXT_MARGIN_TOP = Math.round(8 * SCALE);

const styles = StyleSheet.create({
  compassContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: COMPASS_PADDING_VERTICAL,
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
    borderWidth: COMPASS_BORDER_WIDTH,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
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
    fontSize: FONT_COMPASS_MARK,
  },
  north: {
    top: Math.round(12 * SCALE),
    left: '50%',
    marginLeft: -Math.round(10 * SCALE),
  },
  east: {
    right: Math.round(12 * SCALE),
    top: '50%',
    marginTop: -Math.round(12 * SCALE),
  },
  south: {
    bottom: Math.round(12 * SCALE),
    left: '50%',
    marginLeft: -Math.round(10 * SCALE),
  },
  west: {
    left: Math.round(12 * SCALE),
    top: '50%',
    marginTop: -Math.round(12 * SCALE),
  },
  compassCenter: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - COMPASS_CENTER_SIZE / 2,
    left: COMPASS_SIZE / 2 - COMPASS_CENTER_SIZE / 2,
    width: COMPASS_CENTER_SIZE,
    height: COMPASS_CENTER_SIZE,
    borderWidth: Math.max(1, Math.round(2 * SCALE)),
    borderRadius: COMPASS_CENTER_SIZE / 2,
    zIndex: 3,
  },
  staticNeedle: {
    position: 'absolute',
    top: 0,
    left: COMPASS_SIZE / 2 - NEEDLE_WIDTH / 2,
    width: NEEDLE_WIDTH,
    height: NEEDLE_HEIGHT,
    backgroundColor: '#F59E0B',
    borderRadius: NEEDLE_RADIUS,
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
    marginTop: MARGIN_TOP_QIBLA_INFO,
    alignItems: 'center',
  },
  directionLabel: {
    fontSize: FONT_DIRECTION_LABEL,
    marginBottom: Math.round(4 * SCALE),
  },
  directionValue: {
    fontSize: FONT_DIRECTION_VALUE,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  alignedText: {
    fontSize: FONT_ALIGNED_TEXT,
    fontWeight: 'bold',
    marginTop: ALIGNED_TEXT_MARGIN_TOP,
  },
  locationCard: {
    marginTop: LOCATION_CARD_MARGIN_TOP,
    borderRadius: LOCATION_CARD_RADIUS,
    borderWidth: 1,
    padding: LOCATION_CARD_PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: LOCATION_ROW_PADDING_VERTICAL,
    borderBottomWidth: 1,
  },
  centerContent: {
    alignItems: 'center',
    padding: CENTER_CONTENT_PADDING,
  },
  refreshButton: {
    paddingHorizontal: Math.round(20 * SCALE),
    paddingVertical: Math.round(10 * SCALE),
    borderRadius: Math.round(8 * SCALE),
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
    borderRadius: Math.round(16 * SCALE),
  },
});
