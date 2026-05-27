import * as SQLite from 'expo-sqlite';
import { CrisisMessage } from '../protocol/types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('crisis_comms.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        priority INTEGER NOT NULL,
        type TEXT NOT NULL,
        sender_pubkey TEXT NOT NULL,
        sender_alias TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        ttl INTEGER NOT NULL,
        signature TEXT NOT NULL,
        relay_path TEXT NOT NULL,
        location TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel, timestamp DESC);
      CREATE TABLE IF NOT EXISTS peers (
        pubkey TEXT PRIMARY KEY,
        alias TEXT NOT NULL,
        last_seen INTEGER NOT NULL,
        hop_distance INTEGER NOT NULL,
        is_verified INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

export async function saveMessage(msg: CrisisMessage): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO messages
       (id, channel, priority, type, sender_pubkey, sender_alias, payload, timestamp, ttl, signature, relay_path, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    msg.id, msg.channel, msg.priority, msg.type,
    msg.senderPubkey, msg.senderAlias, msg.payload,
    msg.timestamp, msg.ttl, msg.signature,
    JSON.stringify(msg.relayPath),
    msg.location ? JSON.stringify(msg.location) : null,
  );
}

export async function getMessagesForChannel(channel: string, limit = 100): Promise<CrisisMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, any>>(
    `SELECT * FROM messages WHERE channel = ? ORDER BY timestamp DESC LIMIT ?`,
    channel, limit,
  );
  return rows.map(rowToMessage).reverse();
}

export async function savePeer(peer: import('../protocol/types').Peer): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO peers (pubkey, alias, last_seen, hop_distance, is_verified)
     VALUES (?, ?, ?, ?, ?)`,
    peer.pubkey, peer.alias, peer.lastSeen, peer.hopDistance, peer.isVerifiedResponder ? 1 : 0,
  );
}

function rowToMessage(row: Record<string, any>): CrisisMessage {
  return {
    id: row.id,
    channel: row.channel,
    priority: row.priority,
    type: row.type,
    senderPubkey: row.sender_pubkey,
    senderAlias: row.sender_alias,
    payload: row.payload,
    timestamp: row.timestamp,
    ttl: row.ttl,
    signature: row.signature,
    relayPath: JSON.parse(row.relay_path),
    location: row.location ? JSON.parse(row.location) : undefined,
  };
}
