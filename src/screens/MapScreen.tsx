import React, { useEffect, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import shelterData from '../data/shelters.json';

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

const ALL_TYPES: ShelterType[] = ['education', 'sports', 'community', 'care'];
const shelters = shelterData.shelters as Shelter[];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function MapScreen() {
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [filters, setFilters] = useState<Set<ShelterType>>(new Set(ALL_TYPES));
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const withDistance = shelters
    .filter(s => filters.has(s.type))
    .filter(s =>
      query.length === 0 ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.district.toLowerCase().includes(query.toLowerCase()) ||
      s.address.toLowerCase().includes(query.toLowerCase()),
    )
    .map(s => ({
      ...s,
      distanceKm: userLoc ? haversineKm(userLoc.lat, userLoc.lon, s.lat, s.lon) : null,
    }))
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return a.name.localeCompare(b.name);
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shelters</Text>
        <Text style={styles.count}>{withDistance.length} of {shelters.length}</Text>
      </View>

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name={'magnify' as any} size={16} color="#555" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, district..."
          placeholderTextColor="#444"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name={'close-circle' as any} size={16} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterBar}>
        {ALL_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.chip,
              { borderColor: TYPE_COLORS[type] },
              filters.has(type) && { backgroundColor: TYPE_COLORS[type] + '28' },
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
      </View>

      {!userLoc && (
        <View style={styles.locBanner}>
          <MaterialCommunityIcons name={'map-marker-off' as any} size={13} color="#888" />
          <Text style={styles.locBannerText}>Location unavailable — sorted alphabetically</Text>
        </View>
      )}

      <FlatList
        data={withDistance}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpanded(isOpen ? null : item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typeDot, { backgroundColor: TYPE_COLORS[item.type] }]} />
                <View style={styles.cardMain}>
                  <Text style={styles.cardName} numberOfLines={isOpen ? undefined : 1}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.address} · {item.district}</Text>
                </View>
                {item.distanceKm !== null && (
                  <Text style={styles.distance}>{formatDistance(item.distanceKm)}</Text>
                )}
              </View>

              {isOpen && (
                <View style={styles.cardDetail}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailStat}>
                      <MaterialCommunityIcons name={'account-group' as any} size={14} color="#4FC3F7" />
                      <Text style={styles.detailVal}>{item.capacity.toLocaleString()}</Text>
                      <Text style={styles.detailLbl}>capacity</Text>
                    </View>
                    <View style={styles.detailStat}>
                      <MaterialCommunityIcons name={'floor-plan' as any} size={14} color="#CE93D8" />
                      <Text style={styles.detailVal}>{item.area_sqm.toLocaleString()} m²</Text>
                      <Text style={styles.detailLbl}>area</Text>
                    </View>
                    <View style={[styles.typeBadge, { borderColor: TYPE_COLORS[item.type], backgroundColor: TYPE_COLORS[item.type] + '1a' }]}>
                      <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] }]}>
                        {TYPE_LABELS[item.type].toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No shelters match your filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  count: { color: '#555', fontSize: 13 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 12, marginBottom: 8,
    backgroundColor: '#141420', borderRadius: 10, borderWidth: 1, borderColor: '#1e1e35',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  filterBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 14, paddingBottom: 10,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, backgroundColor: 'transparent',
  },
  chipLabel: { fontSize: 11, fontWeight: '600' },

  locBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, marginBottom: 8,
  },
  locBannerText: { color: '#555', fontSize: 12 },

  list: { paddingHorizontal: 14, paddingBottom: 24 },

  card: {
    backgroundColor: '#10101a', borderRadius: 12,
    borderWidth: 1, borderColor: '#1a1a2e',
    marginBottom: 8, padding: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardMain: { flex: 1 },
  cardName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cardSub: { color: '#666', fontSize: 12, marginTop: 2 },
  distance: { color: '#4FC3F7', fontSize: 12, fontWeight: '600', flexShrink: 0 },

  cardDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1a1a2e' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailVal: { color: '#fff', fontSize: 13, fontWeight: '600' },
  detailLbl: { color: '#555', fontSize: 11 },
  typeBadge: {
    marginLeft: 'auto', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 14 },
});
