# CrisisComms — Quick Start

## Prerequisites

- Node.js 18+ (https://nodejs.org)
- Expo Go app on your phone, OR iOS/Android simulator
- (Optional) Multiple devices/simulators on the same Wi-Fi for mesh testing

---

## 1. Install dependencies

```bash
cd C:\Users\aleks\Projects\crisis-comms
npm install
```

---

## 2. Start the mesh simulator

Open a terminal and run:

```bash
cd sim
npm install
node server.js
```

Note the IP address of your machine (e.g. `192.168.1.42`).

---

## 3. Start the Expo app

```bash
cd C:\Users\aleks\Projects\crisis-comms
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android.

---

## 4. Configure the relay URL

In the app → **Settings** tab → set the relay URL to:

```
ws://192.168.1.42:8765
```

(Replace with your machine's actual LAN IP.)

---

## 5. Test multi-device mesh

Open Expo Go on a second phone (or open a second simulator) and connect it to the same relay URL.

Each device gets a random virtual position. Devices within **150 virtual metres** of each other exchange messages directly. Move them further apart (restart the sim and note positions) to test store-and-forward.

---

## Architecture overview

```
app/                  Expo Router screens
  _layout.tsx         Root: starts MeshService on launch
  channels.tsx        Channel list
  channel/[id].tsx    Chat view
  network.tsx         Peer/mesh status
  settings.tsx        Identity + relay config

src/
  protocol/
    types.ts          CrisisMessage, MessagePriority, Channel types
    MessageRouter.ts  Epidemic routing, TTL, dedup
    PriorityQueue.ts  Priority min-heap for store-and-forward
  identity/
    Keypair.ts        Ed25519 keygen, sign, verify (tweetnacl)
  transport/
    SimulatedWSTransport.ts   WebSocket relay client
    MeshService.ts    Top-level mesh wiring (transport + routing + store)
  channels/
    DefaultChannels.ts  8 preset crisis channels
  storage/
    MessageStore.ts   SQLite persistence
  store/
    index.ts          Zustand global state

sim/
  server.js           Node.js proximity-aware mesh relay simulator
```

---

## Replacing the simulated transport with real BLE

When you're ready to deploy on real hardware, implement:

```ts
// src/transport/BluetoothLETransport.ts
class BluetoothLETransport {
  connect() { ... }
  send(msg: CrisisMessage): boolean { ... }
  on(event, handler) { ... }
  off(event, handler) { ... }
}
```

Then swap it in `MeshService.ts` — the routing, crypto, storage, and UI layers are transport-agnostic.

Recommended library: `react-native-ble-plx` for iOS/Android BLE.
