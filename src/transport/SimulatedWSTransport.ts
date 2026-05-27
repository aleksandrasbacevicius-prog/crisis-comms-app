import { CrisisMessage, Peer } from '../protocol/types';

// Simulated transport over WebSocket.
// The sim/server.js relay assigns a virtual "position" to each connected node
// and only delivers messages between nodes within proximity range.
// Swapping this class for a BluetoothLETransport later requires no changes
// to the protocol or routing layers.

export type TransportEventMap = {
  message: (msg: CrisisMessage) => void;
  peerConnected: (peer: Peer) => void;
  peerDisconnected: (pubkey: string) => void;
  connected: () => void;
  disconnected: () => void;
};

type EventKey = keyof TransportEventMap;

export class SimulatedWSTransport {
  private ws: WebSocket | null = null;
  private handlers: Partial<{ [K in EventKey]: TransportEventMap[K][] }> = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  public isConnected = false;

  constructor(
    private readonly serverUrl: string,
    private readonly pubkey: string,
    private readonly alias: string,
  ) {}

  connect(): void {
    if (this.ws) return;
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.ws!.send(JSON.stringify({ type: 'REGISTER', pubkey: this.pubkey, alias: this.alias }));
        this._emit('connected');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'MESSAGE') {
            this._emit('message', data.payload as CrisisMessage);
          } else if (data.type === 'PEER_CONNECTED') {
            this._emit('peerConnected', data.peer as Peer);
          } else if (data.type === 'PEER_DISCONNECTED') {
            this._emit('peerDisconnected', data.pubkey as string);
          }
        } catch {
          // malformed frame — ignore
        }
      };

      this.ws.onerror = () => {
        // errors always precede onclose, handled there
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this._emit('disconnected');
        // Auto-reconnect after 5 s
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      };
    } catch {
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }

  send(msg: CrisisMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type: 'MESSAGE', payload: msg }));
    return true;
  }

  on<K extends EventKey>(event: K, handler: TransportEventMap[K]): void {
    if (!this.handlers[event]) this.handlers[event] = [];
    (this.handlers[event] as TransportEventMap[K][]).push(handler);
  }

  off<K extends EventKey>(event: K, handler: TransportEventMap[K]): void {
    if (!this.handlers[event]) return;
    this.handlers[event] = (this.handlers[event] as TransportEventMap[K][]).filter(h => h !== handler) as any;
  }

  private _emit<K extends EventKey>(event: K, ...args: Parameters<TransportEventMap[K]>): void {
    const list = this.handlers[event] as ((...a: any[]) => void)[] | undefined;
    list?.forEach(h => h(...args));
  }
}
