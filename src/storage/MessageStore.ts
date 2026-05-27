import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrisisMessage, Peer } from '../protocol/types';

const MAX_MESSAGES_PER_CHANNEL = 200;

function msgKey(channel: string) {
  return `messages:${channel}`;
}

export async function saveMessage(msg: CrisisMessage): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(msgKey(msg.channel));
    const existing: CrisisMessage[] = raw ? JSON.parse(raw) : [];
    if (existing.some(m => m.id === msg.id)) return;
    const updated = [...existing, msg]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_MESSAGES_PER_CHANNEL);
    await AsyncStorage.setItem(msgKey(msg.channel), JSON.stringify(updated));
  } catch {
    // persistence failure is non-fatal
  }
}

export async function getMessagesForChannel(channel: string, limit = 100): Promise<CrisisMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(msgKey(channel));
    if (!raw) return [];
    const msgs: CrisisMessage[] = JSON.parse(raw);
    return msgs.slice(-limit);
  } catch {
    return [];
  }
}

export async function savePeer(peer: Peer): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem('peers');
    const peers: Peer[] = raw ? JSON.parse(raw) : [];
    const updated = [...peers.filter(p => p.pubkey !== peer.pubkey), peer];
    await AsyncStorage.setItem('peers', JSON.stringify(updated));
  } catch {
    // non-fatal
  }
}
