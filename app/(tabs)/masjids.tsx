import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
// Try to use Slider if available
let Slider: any = null;
try {
  Slider = require('@react-native-community/slider').default;
} catch {}

const MASJIDS = [
  {
    id: 1,
    name: 'Moskee Al-Haram',
    address: 'Hoofdstraat 45, 9240 Zele',
    coordinates: [51.0680, 4.0420],
  },
  {
    id: 2,
    name: 'Islamic Center Dendermonde',
    address: 'Kerkstraat 12, 9200 Dendermonde',
    coordinates: [51.0280, 4.1010],
  },
  {
    id: 3,
    name: 'Masjid An-Noor Lokeren',
    address: 'Molenstraat 67, 9160 Lokeren',
    coordinates: [51.1040, 3.9940],
  },
  {
    id: 4,
    name: 'Grote Moskee Gent',
    address: 'Hobbemastraat 1, 9000 Gent',
    coordinates: [51.0500, 3.7303],
  },
];

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

function openDirections(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Maps.'));
}

function openCall() {
  Linking.openURL('tel:+32123456789').catch(() => Alert.alert('Error', 'Could not open dialer.'));
}

export default function MasjidsTab() {
  const colorScheme = useColorScheme() ?? 'light';
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState(10); // km

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

  // Calculate distances
  const masjidsWithDistance = MASJIDS.map((m) => {
    let distance = null;
    if (location) {
      distance = haversineDistance(location.lat, location.lng, m.coordinates[0], m.coordinates[1]);
    }
    return { ...m, distance };
  }).sort((a, b) => {
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  // Filter by maxDistance
  const filteredMasjids = masjidsWithDistance.filter(
    m => m.distance != null && m.distance <= maxDistance
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <View style={{ paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontWeight: 'bold', color: Colors[colorScheme].primary, fontSize: 28 }}>Masjids Nearby</ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 0, backgroundColor: Colors[colorScheme].background }}>
        {/* Distance Filter */}
        {location && (
          <View style={styles.filterRow}>
            <ThemedText style={{ marginRight: 8 }}>Within</ThemedText>
            {Slider ? (
              <Slider
                style={{ flex: 1, marginHorizontal: 8 }}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={maxDistance}
                onValueChange={setMaxDistance}
                minimumTrackTintColor={Colors[colorScheme].primary}
                maximumTrackTintColor="#ccc"
                thumbTintColor={Colors[colorScheme].primary}
              />
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 5, 10, 20, 30, 50].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.filterBtn, maxDistance === d && styles.filterBtnActive]}
                    onPress={() => setMaxDistance(d)}
                  >
                    <Text style={{ color: maxDistance === d ? '#fff' : '#333' }}>{d} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <ThemedText style={{ marginLeft: 8 }}>{maxDistance} km</ThemedText>
          </View>
        )}
        {/* Map View */}
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation={true}
            showsMyLocationButton={Platform.OS === 'android'}
          >
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              title="You"
              pinColor={Colors[colorScheme].primary}
            />
            {filteredMasjids.map((m) => (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.coordinates[0], longitude: m.coordinates[1] }}
                title={m.name}
                description={m.address}
                pinColor={Colors[colorScheme].secondary}
              />
            ))}
          </MapView>
        )}
        {/* No masjids found label */}
        {location && !loading && !errorMsg && filteredMasjids.length === 0 && (
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <ThemedText style={{ color: Colors[colorScheme].warning, fontWeight: 'bold' }}>
              No masjids found within {maxDistance} km.
            </ThemedText>
          </View>
        )}
        {/* Masjid List */}
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
          <FlatList
            data={filteredMasjids}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ThemedView style={styles.masjidCard}>
                <View style={styles.masjidHeader}>
                  <View style={styles.masjidInfo}>
                    <ThemedText style={styles.masjidName}>{item.name}</ThemedText>
                    <ThemedText style={styles.masjidAddress}>{item.address}</ThemedText>
                  </View>
                  <ThemedText style={styles.masjidDistance}>
                    {item.distance != null ? `${item.distance.toFixed(1)} km` : '--'}
                  </ThemedText>
                </View>
                <View style={styles.masjidActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openDirections(item.coordinates[0], item.coordinates[1])}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={styles.actionBtnText}>Directions</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={openCall}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.actionBtnText, styles.secondaryBtnText]}>Call</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  filterBtnActive: {
    backgroundColor: '#10B981',
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  list: {
    paddingBottom: 24,
  },
  masjidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  masjidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  masjidInfo: {
    flex: 1,
  },
  masjidName: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  masjidAddress: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  masjidDistance: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  masjidActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#eee',
  },
  secondaryBtnText: {
    color: '#10B981',
  },
}); 