/**
 * CrisisComms Mesh Relay Simulator
 *
 * Simulates a proximity-based mesh network over WebSocket.
 * Each connected "node" (device/simulator) is assigned a random 2D position.
 * Messages are only forwarded to nodes within PROXIMITY_RADIUS of the sender,
 * mimicking Bluetooth LE or Wi-Fi Direct range.
 *
 * Also implements store-and-forward: messages for offline nodes are buffered
 * and delivered when the node reconnects.
 *
 * Usage: node sim/server.js [port] [radius]
 */

const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2] ?? '8765');
const PROXIMITY_RADIUS = parseFloat(process.argv[3] ?? '150');  // virtual meters
const GRID_SIZE = 500;  // virtual world is 500x500 m
const MAX_BUFFER_PER_NODE = 500;
const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

const nodes = new Map();      // pubkey -> NodeState
const messageBuffer = new Map(); // pubkey -> Message[]  (store-and-forward)

function randomPos() {
  return { x: Math.random() * GRID_SIZE, y: Math.random() * GRID_SIZE };
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getNearby(senderPubkey) {
  const sender = nodes.get(senderPubkey);
  if (!sender) return [];
  return [...nodes.values()].filter(n =>
    n.pubkey !== senderPubkey && distance(sender.pos, n.pos) <= PROXIMITY_RADIUS
  );
}

function broadcast(senderPubkey, data) {
  const nearby = getNearby(senderPubkey);
  const serialized = JSON.stringify(data);
  nearby.forEach(node => {
    if (node.ws.readyState === 1) {
      node.ws.send(serialized);
    }
  });
}

function deliverBuffer(pubkey, ws) {
  const buffered = messageBuffer.get(pubkey) ?? [];
  const now = Date.now();
  const fresh = buffered.filter(m => now - (m.payload?.timestamp ?? 0) < MESSAGE_TTL_MS);
  messageBuffer.set(pubkey, []);
  fresh.forEach(msg => {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  });
  if (fresh.length > 0) {
    console.log(`[sim] Delivered ${fresh.length} buffered messages to ${pubkey.slice(0, 8)}…`);
  }
}

function bufferForOfflineNodes(senderPubkey, data) {
  const sender = nodes.get(senderPubkey);
  if (!sender) return;

  // Buffer for all nodes in radius that are NOT connected right now
  nodes.forEach((node, pubkey) => {
    if (pubkey === senderPubkey) return;
    if (distance(sender.pos, node.pos) > PROXIMITY_RADIUS) return;
    if (node.ws.readyState !== 1) {
      const buf = messageBuffer.get(pubkey) ?? [];
      if (buf.length < MAX_BUFFER_PER_NODE) {
        buf.push(data);
        messageBuffer.set(pubkey, buf);
      }
    }
  });
}

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`\n[sim] CrisisComms Mesh Simulator running on ws://0.0.0.0:${PORT}`);
  console.log(`[sim] Proximity radius: ${PROXIMITY_RADIUS}m  |  World: ${GRID_SIZE}x${GRID_SIZE}m`);
  console.log(`[sim] Connect your Expo app and set the relay URL to ws://<this-machine-ip>:${PORT}\n`);
});

wss.on('connection', (ws) => {
  let pubkey = null;

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }

    if (data.type === 'REGISTER') {
      pubkey = data.pubkey;
      const pos = randomPos();
      nodes.set(pubkey, { pubkey, alias: data.alias, pos, ws });

      console.log(`[sim] + ${data.alias} (${pubkey.slice(0, 8)}…) at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);

      // Notify existing nearby peers of this new node
      const peerInfo = { pubkey, alias: data.alias, lastSeen: Date.now(), hopDistance: 1, isVerifiedResponder: false };
      broadcast(pubkey, { type: 'PEER_CONNECTED', peer: peerInfo });

      // Tell this new node about its nearby peers
      getNearby(pubkey).forEach(nearby => {
        const nearbyInfo = { pubkey: nearby.pubkey, alias: nearby.alias, lastSeen: Date.now(), hopDistance: 1, isVerifiedResponder: false };
        ws.send(JSON.stringify({ type: 'PEER_CONNECTED', peer: nearbyInfo }));
      });

      // Deliver buffered messages
      deliverBuffer(pubkey, ws);

      printStatus();
      return;
    }

    if (data.type === 'MESSAGE' && pubkey) {
      const msg = data.payload;
      if (!msg?.id) return;

      console.log(`[sim] MSG [${msg.priority ?? '?'}] ${(nodes.get(pubkey)?.alias ?? '?')} -> "${msg.payload?.slice(0, 40)}" ch:${msg.channel}`);

      // Forward to nearby connected nodes
      broadcast(pubkey, data);

      // Buffer for nearby nodes that are currently offline (store-and-forward)
      bufferForOfflineNodes(pubkey, data);
    }
  });

  ws.on('close', () => {
    if (pubkey) {
      const node = nodes.get(pubkey);
      console.log(`[sim] - ${node?.alias ?? '?'} (${pubkey.slice(0, 8)}…) disconnected`);
      broadcast(pubkey, { type: 'PEER_DISCONNECTED', pubkey });
      // Keep node in map with closed ws for buffer delivery on reconnect
      printStatus();
    }
  });

  ws.on('error', () => {});
});

function printStatus() {
  const active = [...nodes.values()].filter(n => n.ws.readyState === 1);
  console.log(`[sim] Active nodes: ${active.length}  |  ${active.map(n => n.alias).join(', ') || 'none'}`);
}
