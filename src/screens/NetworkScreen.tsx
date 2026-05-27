import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Peer } from '../protocol/types';

function PeerRow({ peer }: { peer: Peer }) {
  const age = Math.round((Date.now() - peer.lastSeen) / 1000);
  return (
    <View style={styles.peerRow}>
      <View style={styles.peerIcon}>
        <MaterialCommunityIcons
          name={peer.isVerifiedResponder ? 'shield-check' : 'account'}
          size={20}
          color={peer.isVerifiedResponder ? '#4FC3F7' : '#888'}
        />
      </View>
      <View style={styles.peerInfo}>
        <View style={styles.peerNameRow}>
          <Text style={styles.peerAlias}>{peer.alias}</Text>
          {peer.isVerifiedResponder && (
            <Text style={styles.verifiedBadge}>VERIFIED</Text>
          )}
        </View>
        <Text style={styles.peerMeta}>
          {peer.hopDistance === 1 ? 'Direct' : `${peer.hopDistance} hops`}
          {' · '}last seen {age < 60 ? `${age}s` : `${Math.round(age / 60)}m`} ago
        </Text>
      </View>
      <View style={[styles.hopBadge, { backgroundColor: peer.hopDistance === 1 ? '#1a3a1a' : '#1a1a2e' }]}>
        <Text style={[styles.hopText, { color: peer.hopDistance === 1 ? '#4CAF50' : '#888' }]}>
          {peer.hopDistance}
        </Text>
      </View>
    </View>
  );
}

export function NetworkScreen() {
  const peers = useStore(s => s.peers);
  const isConnected = useStore(s => s.isConnected);
  const simServerUrl = useStore(s => s.simServerUrl);
  const myPubkey = useStore(s => s.myPubkey);
  const myAlias = useStore(s => s.myAlias);

  const directPeers = peers.filter(p => p.hopDistance === 1);
  const relayPeers = peers.filter(p => p.hopDistance > 1);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Mesh Network</Text>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>{isConnected ? 'Connected to relay' : 'Disconnected'}</Text>
        </View>
        <Text style={styles.serverUrl}>{simServerUrl}</Text>
        <Text style={styles.selfKey} numberOfLines={1}>
          Your key: {myAlias} · {myPubkey.slice(0, 16)}…
        </Text>
      </View>

      <Text style={styles.sectionLabel}>
        DIRECT PEERS ({directPeers.length})
      </Text>
      {directPeers.map(p => <PeerRow key={p.pubkey} peer={p} />)}

      {relayPeers.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>REACHABLE VIA RELAY ({relayPeers.length})</Text>
          {relayPeers.map(p => <PeerRow key={p.pubkey} peer={p} />)}
        </>
      )}

      {peers.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="access-point-network-off" size={48} color="#333" />
          <Text style={styles.emptyText}>No peers discovered</Text>
          <Text style={styles.emptyHint}>
            Make sure the simulator server is running and other devices are connected to the same relay.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingTop: 60 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, marginBottom: 16 },
  statusCard: {
    backgroundColor: '#1a1a2e', marginHorizontal: 16, borderRadius: 12,
    padding: 14, marginBottom: 20, gap: 6,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#eee', fontWeight: '600' },
  serverUrl: { color: '#555', fontSize: 12 },
  selfKey: { color: '#555', fontSize: 11 },
  sectionLabel: { color: '#444', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 16, paddingVertical: 8 },
  peerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  peerIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center',
  },
  peerInfo: { flex: 1 },
  peerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  peerAlias: { color: '#eee', fontWeight: '600' },
  verifiedBadge: { color: '#4FC3F7', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  peerMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  hopBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hopText: { fontWeight: '700', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40, paddingTop: 60 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptyHint: { color: '#444', fontSize: 13, textAlign: 'center' },
});
