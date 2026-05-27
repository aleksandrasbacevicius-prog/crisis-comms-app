import { create } from 'zustand';
import { CrisisMessage, Peer, Channel, MessagePriority } from '../protocol/types';
import { DEFAULT_CHANNELS } from '../channels/DefaultChannels';

interface AppState {
  // Identity
  myPubkey: string;
  myAlias: string;
  isVerifiedResponder: boolean;
  setIdentity: (pubkey: string, alias: string) => void;
  setAlias: (alias: string) => void;

  // Network
  isConnected: boolean;
  peers: Peer[];
  setConnected: (v: boolean) => void;
  upsertPeer: (peer: Peer) => void;
  removePeer: (pubkey: string) => void;

  // Channels
  channels: Channel[];
  activeChannelId: string;
  setActiveChannel: (id: string) => void;
  incrementUnread: (channelId: string, msg: CrisisMessage) => void;
  clearUnread: (channelId: string) => void;

  // Messages (in-memory cache per channel)
  messages: Record<string, CrisisMessage[]>;
  addMessage: (msg: CrisisMessage) => void;

  // Emergency banner
  activeAlert: CrisisMessage | null;
  dismissAlert: () => void;

  // Simulator server URL
  simServerUrl: string;
  setSimServerUrl: (url: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  myPubkey: '',
  myAlias: 'Anonymous',
  isVerifiedResponder: false,
  setIdentity: (pubkey, alias) => set({ myPubkey: pubkey, myAlias: alias }),
  setAlias: (alias) => set({ myAlias: alias }),

  isConnected: false,
  peers: [],
  setConnected: (v) => set({ isConnected: v }),
  upsertPeer: (peer) => set(s => {
    const filtered = s.peers.filter(p => p.pubkey !== peer.pubkey);
    return { peers: [...filtered, peer] };
  }),
  removePeer: (pubkey) => set(s => ({ peers: s.peers.filter(p => p.pubkey !== pubkey) })),

  channels: DEFAULT_CHANNELS.map(c => ({ ...c, unreadCount: 0 })),
  activeChannelId: 'emergency.general',
  setActiveChannel: (id) => set({ activeChannelId: id }),
  incrementUnread: (channelId, msg) => set(s => ({
    channels: s.channels.map(c =>
      c.id === channelId
        ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: msg }
        : c,
    ),
  })),
  clearUnread: (channelId) => set(s => ({
    channels: s.channels.map(c => c.id === channelId ? { ...c, unreadCount: 0 } : c),
  })),

  messages: {},
  addMessage: (msg) => {
    set(s => {
      const existing = s.messages[msg.channel] ?? [];
      if (existing.some(m => m.id === msg.id)) return s;
      const updated = [...existing, msg].sort((a, b) => a.timestamp - b.timestamp);
      return { messages: { ...s.messages, [msg.channel]: updated } };
    });
    const { activeChannelId, activeAlert } = get();
    if (msg.channel !== activeChannelId) {
      get().incrementUnread(msg.channel, msg);
    }
    if (msg.priority === MessagePriority.EMERGENCY && !activeAlert) {
      set({ activeAlert: msg });
    }
  },

  activeAlert: null,
  dismissAlert: () => set({ activeAlert: null }),

  simServerUrl: 'ws://192.168.1.100:8765',
  setSimServerUrl: (url) => set({ simServerUrl: url }),
}));
