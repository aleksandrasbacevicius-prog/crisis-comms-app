import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import shelterData from '../../assets/shelters.json';

type ShelterType = 'education' | 'sports' | 'community' | 'care';

interface Shelter {
  id: string;
  name: string;
  address: string;
  district: string;
  capacity: number;
  area_sqm: number;
  lat: number;
  lon: number;
  type: ShelterType;
  status: string;
}

const TYPE_COLORS: Record<ShelterType, string> = {
  education: '#4FC3F7',
  sports:    '#66BB6A',
  community: '#CE93D8',
  care:      '#FFB74D',
};

const TYPE_LABELS: Record<ShelterType, string> = {
  education: 'School',
  sports:    'Sports',
  community: 'Community',
  care:      'Care',
};

const TYPE_ICONS: Record<ShelterType, string> = {
  education: 'school',
  sports:    'dumbbell',
  community: 'domain',
  care:      'hospital-building',
};

const VILNIUS: Region = {
  latitude: 54.687,
  longitude: 25.280,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ALL_TYPES: ShelterType[] = ['education', 'sports', 'community', 'care'];
const shelters = shelterData.shelters as Shelter[];

export function MapScreen() {
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [selected, setSelected] = useState<Shelter | null>(null);
  const [filters, setFilters] = useState<Set<ShelterType>>(new Set(ALL_TYPES));

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLoc({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    })();
  }, []);

  const toggleFilter = (type: ShelterType) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const visible = shelters.filter(s => filters.has(s.type));

  const distanceTo = (s: Shelter): string | null => {
    if (!userLoc) return null;
    const km = haversineKm(userLoc.lat, userLoc.lon, s.lat, s.lon);
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shelters</Text>
        <View style={styles.offlineRow}>
          <MaterialCommunityIcons name={'wifi-off' as any} size={13} color="#888" />
          <Text style={styles.offlineLabel}>offline map</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={VILNIUS}
          showsUserLocation={!!userLoc}
          showsMyLocationButton={false}
          showsCompass={false}
          onPress={() => setSelected(null)}
        >
          {visible.map(shelter => (
            <Marker
              key={shelter.id}
              coordinate={{ latitude: shelter.lat, longitude: shelter.lon }}
              onPress={() => setSelected(shelter)}
              tracksViewChanges={false}
            >
              <View style={[styles.markerOuter, { borderColor: TYPE_COLORS[shelter.type] }]}>
                <View style={[styles.markerInner, { backgroundColor: TYPE_COLORS[shelter.type] }]} />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.filterBar} pointerEvents="box-none">
          {ALL_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                { borderColor: TYPE_COLORS[type] },
                filters.has(type) && { backgroundColor: TYPE_COLORS[type] + '33' },
              ]}
              onPress={() => toggleFilter(type)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={TYPE_ICONS[type] as any}
                size={11}
                color={filters.has(type) ? TYPE_COLORS[type] : '#555'}
              />
              <Text style={[styles.chipLabel, { color: filters.has(type) ? TYPE_COLORS[type] : '#555' }]}>
                {TYPE_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.countChip}>
            <Text style={styles.countText}>{visible.length}</Text>
          </View>
        </View>

        {selected && (
          <View style={styles.panel}>
            <View style={styles.panelHandle} />
            <View style={styles.panelTopRow}>
              <View style={[styles.badge, {
                borderColor: TYPE_COLORS[selected.type],
                backgroundColor: TYPE_COLORS[selected.type] + '1a',
              }]}>
                <MaterialCommunityIcons name={TYPE_ICONS[selected.type] as any} size={11} color={TYPE_COLORS[selected.type]} />
                <Text style={[styles.badgeText, { color: TYPE_COLORS[selected.type] }]}>
                  {TYPE_LABELS[selected.type].toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} hitSlop={12}>
                <MaterialCommunityIcons name={'close' as any} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.shelterName} numberOfLines={2}>{selected.name}</Text>
            <Text style={styles.shelterAddr}>{selected.address} · {selected.district}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name={'account-group' as any} size={15} color="#4FC3F7" />
                <View style={styles.statTextBlock}>
                  <Text style={styles.statVal}>{selected.capacity.toLocaleString()}</Text>
                  <Text style={styles.statLbl}>capacity</Text>
                </View>
              </View>
              <View style={styles.statSep} />
              <View style={styles.stat}>
                <MaterialCommunityIcons name={'floor-plan' as any} size={15} color="#CE93D8" />
                <View style={styles.statTextBlock}>
                  <Text style={styles.statVal}>{selected.area_sqm.toLocaleString()} m²</Text>
                  <Text style={styles.statLbl}>area</Text>
                </View>
              </View>
              {distanceTo(selected) !== null && (
                <>
                  <View style={styles.statSep} />
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name={'map-marker-distance' as any} size={15} color="#66BB6A" />
                    <View style={styles.statTextBlock}>
                      <Text style={styles.statVal}>{distanceTo(selected)}</Text>
                      <Text style={styles.statLbl}>away</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
    backgroundColor: '#0a0a0f',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  offlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineLabel: { color: '#888', fontSize: 12 },

  mapContainer: { flex: 1 },

  markerOuter: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, backgroundColor: 'rgba(10,10,15,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  markerInner: { width: 8, height: 8, borderRadius: 4 },

  filterBar: {
    position: 'absolute', top: 10, left: 10, right: 10,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  chipLabel: { fontSize: 11, fontWeight: '600' },
  countChip: {
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#333',
    backgroundColor: 'rgba(10,10,15,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: '#888', fontSize: 11, fontWeight: '600' },

  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#10101a',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  panelHandle: {
    alignSelf: 'center', width: 36, height: 4,
    borderRadius: 2, backgroundColor: '#333', marginBottom: 12,
  },
  panelTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  shelterName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4, lineHeight: 22 },
  shelterAddr: { color: '#888', fontSize: 13, marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statTextBlock: {},
  statVal: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statLbl: { color: '#666', fontSize: 11 },
  statSep: { width: 1, height: 28, backgroundColor: '#222', marginHorizontal: 4 },
});
