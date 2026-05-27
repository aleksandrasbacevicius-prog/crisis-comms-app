import { CrisisMessage, MAX_MESSAGE_AGE_MS, MAX_TTL } from './types';
import { verifyMessage, signingPayload } from '../identity/Keypair';

// Epidemic (flooding) router with TTL-based hop limiting and seen-message dedup.
// Each device keeps a bloom-like seen set and forwards unknown messages to all peers.

const SEEN_SET_MAX = 2000;

export class MessageRouter {
  private seen = new Set<string>();

  isKnown(id: string): boolean {
    return this.seen.has(id);
  }

  markSeen(id: string): void {
    if (this.seen.size >= SEEN_SET_MAX) {
      // Drop oldest ~10%
      const toDelete = [...this.seen].slice(0, SEEN_SET_MAX / 10);
      toDelete.forEach(k => this.seen.delete(k));
    }
    this.seen.add(id);
  }

  shouldRelay(msg: CrisisMessage, myPubkey: string): boolean {
    if (this.isKnown(msg.id)) return false;
    if (msg.ttl <= 0) return false;
    if (Date.now() - msg.timestamp > MAX_MESSAGE_AGE_MS) return false;
    return true;
  }

  decrementTTL(msg: CrisisMessage): CrisisMessage {
    return { ...msg, ttl: msg.ttl - 1 };
  }

  appendRelay(msg: CrisisMessage, myPubkey: string): CrisisMessage {
    return { ...msg, relayPath: [...msg.relayPath, myPubkey] };
  }

  verifySignature(msg: CrisisMessage): boolean {
    const payload = signingPayload(msg);
    return verifyMessage(payload, msg.signature, msg.senderPubkey);
  }

  // Returns a copy ready to relay (decremented TTL, relay path appended)
  prepareRelay(msg: CrisisMessage, myPubkey: string): CrisisMessage {
    return this.appendRelay(this.decrementTTL(msg), myPubkey);
  }
}

export const router = new MessageRouter();
