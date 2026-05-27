export enum MessagePriority {
  EMERGENCY = 1,
  MEDICAL = 2,
  EVACUATION = 3,
  COORDINATION = 4,
  CHAT = 5,
}

export enum MessageType {
  CHAT = 'CHAT',
  ALERT = 'ALERT',
  LOCATION = 'LOCATION',
  STATUS = 'STATUS',
  ACK = 'ACK',
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface CrisisMessage {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  channel: string;
  senderPubkey: string;
  senderAlias: string;
  payload: string;
  timestamp: number;
  ttl: number;
  signature: string;
  relayPath: string[];
  location?: GeoPoint;
}

export interface Peer {
  pubkey: string;
  alias: string;
  lastSeen: number;
  hopDistance: number;
  isVerifiedResponder: boolean;
  rssi?: number;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  defaultPriority: MessagePriority;
  icon: string;
  color: string;
  unreadCount: number;
  lastMessage?: CrisisMessage;
}

export const PRIORITY_COLORS: Record<MessagePriority, string> = {
  [MessagePriority.EMERGENCY]: '#FF2D2D',
  [MessagePriority.MEDICAL]:   '#FF6B35',
  [MessagePriority.EVACUATION]:'#FFD600',
  [MessagePriority.COORDINATION]: '#4FC3F7',
  [MessagePriority.CHAT]:      '#AAAAAA',
};

export const PRIORITY_LABELS: Record<MessagePriority, string> = {
  [MessagePriority.EMERGENCY]: 'EMERGENCY',
  [MessagePriority.MEDICAL]:   'MEDICAL',
  [MessagePriority.EVACUATION]:'EVACUATION',
  [MessagePriority.COORDINATION]: 'COORDINATION',
  [MessagePriority.CHAT]:      'CHAT',
};

export const MAX_TTL = 7;
export const MAX_MESSAGE_AGE_MS = 24 * 60 * 60 * 1000;
