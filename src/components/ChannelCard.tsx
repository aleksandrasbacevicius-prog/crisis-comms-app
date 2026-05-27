import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Channel, PRIORITY_LABELS } from '../protocol/types';

interface Props {
  channel: Channel;
  isActive: boolean;
  onPress: () => void;
}

export function ChannelCard({ channel, isActive, onPress }: Props) {
  const time = channel.lastMessage
    ? new Date(channel.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: channel.color + '22' }]}>
        <MaterialCommunityIcons
          name={channel.icon as any}
          size={22}
          color={channel.color}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{channel.name}</Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {channel.lastMessage?.payload ?? channel.description}
        </Text>
      </View>
      {channel.unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: channel.color }]}>
          <Text style={styles.badgeText}>{channel.unreadCount > 99 ? '99+' : channel.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
    gap: 12,
  },
  cardActive: { backgroundColor: '#0d1b2a' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: '#eee', fontWeight: '600', fontSize: 15 },
  preview: { color: '#666', fontSize: 13, marginTop: 2 },
  time: { color: '#555', fontSize: 12 },
  badge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
