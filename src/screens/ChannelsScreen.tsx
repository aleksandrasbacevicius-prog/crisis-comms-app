import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store';
import { ChannelCard } from '../components/ChannelCard';

export function ChannelsScreen() {
  const channels = useStore(s => s.channels);
  const activeChannelId = useStore(s => s.activeChannelId);
  const isConnected = useStore(s => s.isConnected);
  const peers = useStore(s => s.peers);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CrisisComms</Text>
        <View style={styles.status}>
          <View style={[styles.dot, { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>
            {isConnected ? `${peers.length} peer${peers.length !== 1 ? 's' : ''}` : 'offline'}
          </Text>
        </View>
      </View>
      <FlatList
        data={channels}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <ChannelCard
            channel={item}
            isActive={item.id === activeChannelId}
            onPress={() => router.push(`/channel/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#888', fontSize: 13 },
});
