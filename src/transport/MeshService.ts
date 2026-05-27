// MeshService: top-level singleton that wires transport + routing + store-and-forward.
// Call MeshService.start() once on app launch.

import { v4 as uuidv4 } from 'uuid';
import { SimulatedWSTransport } from './SimulatedWSTransport';
import { router } from '../protocol/MessageRouter';
import { MessagePriorityQueue } from '../protocol/PriorityQueue';
import { CrisisMessage, MessagePriority, MessageType, MAX_TTL } from '../protocol/types';
import { getOrCreateKeypair, getAlias, signMessage, signingPayload } from '../identity/Keypair';
import { saveMessage, savePeer } from '../storage/MessageStore';
import { useStore } from '../store';

let transport: SimulatedWSTransport | null = null;
const forwardQueue = new MessagePriorityQueue();

export async function startMeshService(serverUrl: string): Promise<void> {
  const keypair = await getOrCreateKeypair();
  const alias = await getAlias();

  useStore.getState().setIdentity(keypair.publicKeyB64, alias);

  transport = new SimulatedWSTransport(serverUrl, keypair.publicKeyB64, alias);

  transport.on('connected', () => {
    useStore.getState().setConnected(true);
    // Drain store-and-forward queue to newly reachable peers
    drainQueueViaTransport();
  });

  transport.on('disconnected', () => {
    useStore.getState().setConnected(false);
  });

  transport.on('peerConnected', async (peer) => {
    useStore.getState().upsertPeer(peer);
    await savePeer(peer);
    // Send queued messages to this newly reachable peer
    drainQueueViaTransport();
  });

  transport.on('peerDisconnected', (pubkey) => {
    useStore.getState().removePeer(pubkey);
  });

  transport.on('message', async (msg) => {
    if (router.isKnown(msg.id)) return;
    router.markSeen(msg.id);

    if (!router.verifySignature(msg)) {
      console.warn('[mesh] Dropping message with invalid signature:', msg.id);
      return;
    }

    // Deliver locally
    useStore.getState().addMessage(msg);
    await saveMessage(msg);

    // Relay forward if TTL allows
    if (router.shouldRelay(msg, keypair.publicKeyB64)) {
      const relayed = router.prepareRelay(msg, keypair.publicKeyB64);
      if (!transport!.send(relayed)) {
        // Not connected — buffer for later
        forwardQueue.push(relayed);
      }
    }
  });

  transport.connect();
}

export async function sendMessage(
  channelId: string,
  payload: string,
  priority: MessagePriority,
  type: MessageType = MessageType.CHAT,
): Promise<CrisisMessage> {
  const keypair = await getOrCreateKeypair();
  const alias = await getAlias();

  const partial = {
    id: uuidv4(),
    type,
    priority,
    channel: channelId,
    senderPubkey: keypair.publicKeyB64,
    payload,
    timestamp: Date.now(),
  };

  const signature = signMessage(signingPayload(partial as any), keypair.secretKey);
  const msg: CrisisMessage = {
    ...partial,
    senderAlias: alias,
    ttl: MAX_TTL,
    signature,
    relayPath: [],
  };

  router.markSeen(msg.id);
  useStore.getState().addMessage(msg);
  await saveMessage(msg);

  if (!transport?.send(msg)) {
    forwardQueue.push(msg);
  }

  return msg;
}

export function stopMeshService(): void {
  transport?.disconnect();
  transport = null;
}

function drainQueueViaTransport(): void {
  if (!transport) return;
  const toSend = forwardQueue.drainAll();
  const unsent: CrisisMessage[] = [];
  for (const msg of toSend) {
    if (!transport.send(msg)) unsent.push(msg);
  }
  unsent.forEach(m => forwardQueue.push(m));
}
