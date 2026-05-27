import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrisisMessage, PRIORITY_COLORS, MessagePriority } from '../protocol/types';
import { useStore } from '../store';

interface Props {
  message: CrisisMessage;
  peers: import('../protocol/types').Peer[];
}

export function MessageBubble({ message, peers }: Props) {
  const myPubkey = useStore(s => s.myPubkey);
  const isOwn = message.senderPubkey === myPubkey;
  const peer = peers.find(p => p.pubkey === message.senderPubkey);
  const isVerified = peer?.isVerifiedResponder ?? false;
  const color = PRIORITY_COLORS[message.priority as MessagePriority];
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, { borderLeftColor: color, borderLeftWidth: isOwn ? 0 : 3 }]}>
        {!isOwn && (
          <View style={styles.header}>
            <Text style={styles.alias}>{message.senderAlias}</Text>
            {isVerified && (
              <MaterialCommunityIcons name="shield-check" size={13} color="#4FC3F7" style={styles.badge} />
            )}
            {message.relayPath.length > 0 && (
              <Text style={styles.hops}>{message.relayPath.length} hops</Text>
            )}
          </View>
        )}
        <Text style={styles.body}>{message.payload}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 12 },
  rowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%', borderRadius: 12, padding: 10,
    backgroundColor: '#1e1e2e',
  },
  bubbleOwn: { backgroundColor: '#1a3a5c' },
  bubbleOther: {},
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 4 },
  alias: { fontSize: 11, fontWeight: '700', color: '#7ec8e3' },
  badge: { marginLeft: 2 },
  hops: { fontSize: 10, color: '#555', marginLeft: 4 },
  body: { color: '#eee', fontSize: 15 },
  time: { color: '#555', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
});
