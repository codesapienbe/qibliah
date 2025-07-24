import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const KAABA = { lat: 21.4225, lng: 39.8262 };

function calculateQibla(lat: number, lng: number): number {
  // Convert degrees to radians
  const kaabaLat = KAABA.lat * Math.PI / 180;
  const kaabaLng = KAABA.lng * Math.PI / 180;
  const userLat = lat * Math.PI / 180;
  const userLng = lng * Math.PI / 180;
  const dLng = kaabaLng - userLng;
  const y = Math.sin(dLng);
  const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Returns distance in km
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function QiblaTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied.');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (e) {
        setErrorMsg('Could not get location.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  let qiblaDegrees = 123;
  let distance = '~3,200 km';
  let coordsStr = '51.0656°N, 4.0409°E';
  if (location) {
    qiblaDegrees = Math.round(calculateQibla(location.lat, location.lng));
    distance = `${Math.round(haversineDistance(location.lat, location.lng, KAABA.lat, KAABA.lng))} km`;
    coordsStr = `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28 }}>Qibla Direction</ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 0, backgroundColor: Colors[colorScheme].background }}>
        {/* Compass & Info */}
        <View style={styles.compassContainer}>
          <View style={styles.compassWrapper}>
            <View style={[styles.compassCircle, { borderColor: Colors[colorScheme].cardBorder }]}> 
              {/* Markings */}
              <View style={styles.compassMarkings}>
                <ThemedText style={[styles.compassMark, styles.north, { color: Colors[colorScheme].secondary }]}>N</ThemedText>
                <ThemedText style={[styles.compassMark, styles.east]}>E</ThemedText>
                <ThemedText style={[styles.compassMark, styles.south]}>S</ThemedText>
                <ThemedText style={[styles.compassMark, styles.west]}>W</ThemedText>
              </View>
              {/* Needle */}
              <View style={[styles.compassNeedle, { transform: [{ rotate: `${qiblaDegrees}deg` }] }]} />
              {/* Center dot */}
              <View style={[styles.compassCenter, { borderColor: Colors[colorScheme].primary }]} />
            </View>
          </View>
          <View style={styles.qiblaInfo}>
            <ThemedText style={styles.directionLabel}>Qibla Direction</ThemedText>
            <ThemedText style={styles.directionValue}>{qiblaDegrees}°</ThemedText>
          </View>
        </View>
        {/* Location Details */}
        <ThemedView style={styles.locationCard}>
          {loading ? (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <ActivityIndicator size="small" color={Colors[colorScheme].primary} />
              <ThemedText style={{ marginTop: 8 }}>Getting your location...</ThemedText>
            </View>
          ) : errorMsg ? (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <ThemedText style={{ color: Colors[colorScheme].error }}>{errorMsg}</ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.locationRow}>
                <ThemedText>Your Location:</ThemedText>
                <ThemedText>{coordsStr}</ThemedText>
              </View>
              <View style={styles.locationRow}>
                <ThemedText>Distance to Mecca:</ThemedText>
                <ThemedText>{distance}</ThemedText>
              </View>
              <View style={styles.locationRow}>
                <ThemedText>Kaaba (Mecca):</ThemedText>
                <ThemedText>21.4225°N, 39.8262°E</ThemedText>
              </View>
            </>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const COMPASS_SIZE = 240;
const NEEDLE_LENGTH = 90;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 0,
  },
  compassContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    marginBottom: 24,
  },
  compassCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 4,
    borderRadius: COMPASS_SIZE / 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassMarkings: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassMark: {
    position: 'absolute',
    fontWeight: 'bold',
    fontSize: 18,
  },
  north: {
    top: 8,
    left: '50%',
    marginLeft: -10,
  },
  east: {
    right: 8,
    top: '50%',
    marginTop: -10,
  },
  south: {
    bottom: 8,
    left: '50%',
    marginLeft: -10,
  },
  west: {
    left: 8,
    top: '50%',
    marginTop: -10,
  },
  compassNeedle: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - NEEDLE_LENGTH,
    left: COMPASS_SIZE / 2 - 2,
    width: 4,
    height: NEEDLE_LENGTH,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    zIndex: 2,
  },
  compassCenter: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - 8,
    left: COMPASS_SIZE / 2 - 8,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 8,
    zIndex: 3,
  },
  qiblaInfo: {
    alignItems: 'center',
  },
  directionLabel: {
    color: '#888',
    fontSize: 16,
  },
  directionValue: {
    color: '#F59E0B',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 20,
    marginTop: 20,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
}); 