import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MASJIDS = [
  {
    "id": 1,
    "name": "Mehmet Akif",
    "address": "Dendermondestraat 34, 2018 Antwerpen",
    "coordinates": null
  },
  {
    "id": 2,
    "name": "Ensar",
    "address": "Ginderbuiten 49, 2400 Mol",
    "coordinates": null
  },
  {
    "id": 3,
    "name": "Attaqwa",
    "address": "Van Duytstraat 35, 2100 Deurne (Antwerpen)",
    "coordinates": null
  },
  {
    "id": 4,
    "name": "Innerlijke Vrede (Huzur)",
    "address": "Ieperstraat 26, 2018 Antwerpen",
    "coordinates": null
  },
  {
    "id": 5,
    "name": "El Mouslimine",
    "address": "Jan Palfijnstraat 35, 2060 Antwerpen",
    "coordinates": null
  },
  {
    "id": 6,
    "name": "Selimiye",
    "address": "Valentinusstraat 61, 3550 Heusden-Zolder",
    "coordinates": null
  },
  {
    "id": 7,
    "name": "Badr",
    "address": "Mouterijstraat 1, 3500 Hasselt",
    "coordinates": null
  },
  {
    "id": 8,
    "name": "Hassan Ebno Tabit",
    "address": "Noordlaan 133, 3600 Genk",
    "coordinates": null
  },
  {
    "id": 9,
    "name": "Yunus Emre",
    "address": "Wintergroenstraat 61, 3600 Genk",
    "coordinates": null
  },
  {
    "id": 10,
    "name": "Sultan Ahmet",
    "address": "Pastoor Paquaylaan 77, 3550 Heusden-Zolder",
    "coordinates": null
  },
  {
    "id": 11,
    "name": "Yesil",
    "address": "Saviostraat 49, 3530 Houthalen-Helchteren",
    "coordinates": null
  },
  {
    "id": 12,
    "name": "Al Mouhsinine",
    "address": "Hasseltsepoort 17, 3740 Bilzen",
    "coordinates": null
  },
  {
    "id": 13,
    "name": "Mevlana",
    "address": "Wildekerslaan 46, 3600 Genk",
    "coordinates": null
  },
  {
    "id": 14,
    "name": "Yildirim Beyazit",
    "address": "Hooiweg 75, 3600 Genk",
    "coordinates": null
  },
  {
    "id": 15,
    "name": "Selimiye",
    "address": "Vreyshorring 125, 3920 Lommel",
    "coordinates": null
  },
  {
    "id": 16,
    "name": "Fatih",
    "address": "Staatstuinwijk 20/a, 3600 Genk",
    "coordinates": null
  },
  {
    "id": 17,
    "name": "Barmhartig (Arrahma)",
    "address": "Haardstraat 80, 3800 Sint-Truiden",
    "coordinates": null
  },
  {
    "id": 18,
    "name": "Tauhid",
    "address": "Kolonies 8, 3900 Pelt",
    "coordinates": null
  },
  {
    "id": 19,
    "name": "Yavuz Sultan Selim",
    "address": "Langestraat 204, 9050 Ledeberg (Gent)",
    "coordinates": null
  },
  {
    "id": 20,
    "name": "Hicret",
    "address": "Hazewindstraat 47, 9100 Sint-Niklaas",
    "coordinates": null
  },
  {
    "id": 21,
    "name": "Tevhid",
    "address": "Francisco Ferrerlaan 214/a, 9000 Gent",
    "coordinates": null
  },
  {
    "id": 22,
    "name": "Ensarija",
    "address": "Loodsenstraat 56 bus 001, 9000 Gent",
    "coordinates": null
  },
  {
    "id": 23,
    "name": "Kevser",
    "address": "Binnenstraat 7, 9300 Aalst",
    "coordinates": null
  },
  {
    "id": 24,
    "name": "Beraat",
    "address": "Vervoortplaats 17, 3290 Diest",
    "coordinates": null
  },
  {
    "id": 25,
    "name": "Al Ihsaan",
    "address": "Kolonel Begaultlaan 45, 3012 Wilsele (Leuven)",
    "coordinates": null
  },
  {
    "id": 26,
    "name": "Assounah",
    "address": "Nieuwstraat 155, 8792 Desselgem (Waregem)",
    "coordinates": null
  },
  {
    "id": 27,
    "name": "Moskee Al Fath (Gent)",
    "address": "Bevelandsekaai (Brugse Poort), 9000 Gent",
    "coordinates": [51.06138, 3.70239]
  },
  {
    "id": 28,
    "name": "Yavuz Sultan Selim (Ledeberg) – map ref",
    "address": "Langestraat 204, 9050 Ledeberg (Gent)",
    "coordinates": null
  },
  {
    "id": 29,
    "name": "Masjid in Brugge (Arabic listing)",
    "address": "Dijver area, 8000 Brugge",
    "coordinates": [51.19503, 3.19488]
  },
  {
    "id": 30,
    "name": "Moskee Wetteren – map ref",
    "address": "Wetteren (exact street to confirm), 9230 Wetteren",
    "coordinates": [51.00813, 3.87962]
  },
  {
    "id": 31,
    "name": "Muattar",
    "address": "Gent (address to confirm)",
    "coordinates": null
  },
  {
    "id": 32,
    "name": "Arruhama",
    "address": "Waasmunster (address to confirm)",
    "coordinates": null
  },
  {
    "id": 33,
    "name": "Al Muwahideen",
    "address": "Antwerpen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 34,
    "name": "Attawhid",
    "address": "Antwerpen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 35,
    "name": "Ennassr",
    "address": "Antwerpen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 36,
    "name": "Al Buraq",
    "address": "Mechelen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 37,
    "name": "Al Inaba",
    "address": "Deurne (Antwerpen) (address to confirm)",
    "coordinates": null
  },
  {
    "id": 38,
    "name": "Arrahmaan",
    "address": "Turnhout (address to confirm)",
    "coordinates": null
  },
  {
    "id": 39,
    "name": "Al Houda",
    "address": "Genk (address to confirm)",
    "coordinates": null
  },
  {
    "id": 40,
    "name": "El Mouslimine",
    "address": "Houthalen-Helchteren (address to confirm)",
    "coordinates": null
  },
  {
    "id": 41,
    "name": "Al Farah Attouba",
    "address": "Genk (address to confirm)",
    "coordinates": null
  },
  {
    "id": 42,
    "name": "Tawheed",
    "address": "Beringen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 43,
    "name": "Nour Al Houda",
    "address": "Landen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 44,
    "name": "Asalam",
    "address": "Tienen (address to confirm)",
    "coordinates": null
  },
  {
    "id": 45,
    "name": "Al Ansar",
    "address": "Sint-Pieters-Leeuw (address to confirm)",
    "coordinates": null
  },
  {
    "id": 46,
    "name": "Arrahman",
    "address": "Halle (address to confirm)",
    "coordinates": null
  },
  {
    "id": 47,
    "name": "Attakwa",
    "address": "Kortrijk (address to confirm)",
    "coordinates": null
  },
  {
    "id": 48,
    "name": "Al Karam",
    "address": "Chaussée de Neerstalle 52, 1190 Forest (Brussels)",
    "coordinates": null
  },
  {
    "id": 49,
    "name": "Al Moustakbal",
    "address": "Rue de l'Avenir 18, 1080 Molenbeek-Saint-Jean (Brussels)",
    "coordinates": null
  },
  {
    "id": 50,
    "name": "Al Moutaquine",
    "address": "Chaussée de Merchtem 53a, 1080 Molenbeek-Saint-Jean (Brussels)",
    "coordinates": null
  },
  {
    "id": 51,
    "name": "ASCTTB",
    "address": "Rue Auguste Gevart 39-41, 1070 Anderlecht (Brussels)",
    "coordinates": null
  },
  {
    "id": 52,
    "name": "Attadamoun (Solidarité culturelle)",
    "address": "Rue des Étangs Noirs 36, 1080 Molenbeek-Saint-Jean (Brussels)",
    "coordinates": null
  },
  {
    "id": 53,
    "name": "Badr (Brussels)",
    "address": "Rue de Ribaucourt 108, 1080 Molenbeek-Saint-Jean (Brussels)",
    "coordinates": null
  },
  {
    "id": 54,
    "name": "Bangladesh Islamic Cultural Centre",
    "address": "Chaussée de Wavre 269, 1050 Ixelles (Brussels)",
    "coordinates": null
  },
  {
    "id": 55,
    "name": "Essalam (Brussels)",
    "address": "Avenue Fonsny 81, 1060 Saint-Gilles (Brussels)",
    "coordinates": null
  },
  {
    "id": 56,
    "name": "Fatih Camii (Brussels)",
    "address": "Chaussée de Haecht 88-89, 1030 Schaerbeek (Brussels)",
    "coordinates": null
  }
]


export default function MasjidsTab() {
  const colorScheme = useColorScheme() ?? 'light';

  const markers = (MASJIDS.filter((m: any) => Array.isArray(m.coordinates) && m.coordinates.length === 2) as Array<{
    id: number;
    name: string;
    address: string;
    coordinates: [number, number];
  }>);

  const computeInitialRegion = () => {
    if (markers.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 60,
        longitudeDelta: 60,
      };
    }
    let minLat = markers[0].coordinates[0];
    let maxLat = markers[0].coordinates[0];
    let minLng = markers[0].coordinates[1];
    let maxLng = markers[0].coordinates[1];
    for (const m of markers) {
      const [lat, lng] = m.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = Math.max(0.1, (maxLat - minLat) * 1.4 || 0.5);
    const longitudeDelta = Math.max(0.1, (maxLng - minLng) * 1.4 || 0.5);
    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };

  const initialRegion = computeInitialRegion();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background, paddingTop: 6 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.coordinates[0], longitude: m.coordinates[1] }}
            title={m.name}
            description={m.address}
            pinColor={Colors[colorScheme].secondary}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
}); 