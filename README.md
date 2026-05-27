# CrisisComms

A disaster and wartime communication app for iOS and Android that works **without internet or cellular infrastructure**. Devices communicate directly over a proximity mesh network (simulated via LAN WebSocket; production-ready to swap in BLE/Wi-Fi Direct).

Inspired by the Lithuanian civil defense app LT72.

---

## Features

- **Proximity mesh networking** — messages hop between nearby devices using epidemic (flood) routing with TTL limiting and seen-message deduplication
- **Store-and-forward** — messages queued in a priority min-heap are delivered when a relay path becomes available, surviving temporary disconnections
- **Priority classes** — `EMERGENCY > MEDICAL > EVACUATION > COORDINATION > CHAT`; emergency messages trigger a full-screen banner on all reachable devices
- **Ed25519 cryptographic identity** — every message is signed with a device-local keypair (tweetnacl); impersonation is detectable
- **8 preset crisis channels** — Emergency Broadcast, Medical Help, Evacuation Routes, Shelter Access, Water & Food, Hazards, Family Reunification, Local Chat
- **Offline shelter map** — 75 real Vilnius municipality collective-protection buildings on an interactive map, with type filters and a tap-to-view detail panel (capacity, area, distance from you)
- **SQLite persistence** — messages survive app restarts
- **Mesh simulator** — Node.js server that assigns random 2D positions to devices and only relays messages within a configurable proximity radius, with store-and-forward for offline nodes

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 / Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| State | Zustand |
| Crypto | tweetnacl (Ed25519) |
| Storage | expo-sqlite v16 (WAL mode) |
| Secure storage | expo-secure-store (keypair) |
| Maps | react-native-maps (Apple Maps / Google Maps) |
| Location | expo-location |
| Transport | WebSocket (simulated); swappable to BLE |

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo Go on your phone (SDK 54), or an iOS/Android simulator

### Install

```bash
git clone https://github.com/aleksandrasbacevicius-prog/crisis-comms-app.git
cd crisis-comms-app
npm install --legacy-peer-deps
```

### Run the mesh simulator

In a separate terminal:

```bash
cd sim
npm install
node server.js
```

The server listens on port `8765`. Note your machine's LAN IP address.

Optional arguments:
```bash
node server.js [port] [proximity-radius-metres]
# e.g. node server.js 8765 200
```

### Start the app

```bash
npx expo start --lan
```

Scan the QR code with Expo Go, or press `i` / `a` for simulators.

### Connect to the relay

In the app → **Settings** tab → set the relay URL to:

```
ws://<your-lan-ip>:8765
```

Open the app on a second device with the same URL to start exchanging messages over the mesh.

---

## Architecture

```
app/
  _layout.tsx            Root layout — starts MeshService on launch
  (tabs)/
    index.tsx            Channels list
    network.tsx          Peer/mesh status
    shelters.tsx         Offline shelter map
    settings.tsx         Identity and relay config
  channel/[id].tsx       Chat screen

src/
  protocol/
    types.ts             CrisisMessage, MessagePriority, Channel types
    MessageRouter.ts     Epidemic routing, TTL, seen-set dedup
    PriorityQueue.ts     Priority min-heap for store-and-forward
  identity/
    Keypair.ts           Ed25519 keygen, sign, verify
  transport/
    SimulatedWSTransport.ts   WebSocket relay client with auto-reconnect
    MeshService.ts            Wires transport + router + queue + store
  channels/
    DefaultChannels.ts   8 preset crisis channel definitions
  storage/
    MessageStore.ts      SQLite persistence (expo-sqlite)
  store/
    index.ts             Zustand global state

sim/
  server.js              Proximity-aware mesh relay simulator

assets/
  shelters.json          75 Vilnius collective-protection buildings
                         (source: Vilniaus miesto savivaldybė, 2026-03-25)
```

### Message flow

```
User types message
  → signed with Ed25519 keypair
  → added to PriorityQueue
  → MeshService drains queue → SimulatedWSTransport → relay server
  → relay forwards to nodes within proximity radius
  → receiving device: MessageRouter checks TTL + seen-set
  → if new: decrement TTL, store, dispatch to UI, re-enqueue for relay
```

### Priority queue

Lower number = higher urgency. Score = `priority × 10¹³ + timestamp` so older messages of equal priority are dequeued first. Messages older than 24 hours are auto-evicted.

---

## Shelter data

`assets/shelters.json` contains 75 collective-protection buildings from the official Vilnius municipality list (*Kolektyvinės apsaugos statinių sąrašas*, authority decree Nr. 955-434/26, updated 2026-03-25). Coordinates were converted from LKS94 to WGS84. Coverage spans all major Vilnius districts; capacity ranges from 222 to 10,688 persons.

---

## Swapping in real BLE transport

The routing, crypto, storage, and UI layers are transport-agnostic. To deploy on real hardware, implement the same interface used by `SimulatedWSTransport`:

```ts
class BluetoothLETransport {
  connect(): void
  send(msg: CrisisMessage): boolean
  on(event: 'message' | 'peerConnected' | 'peerDisconnected' | 'connected' | 'disconnected', handler): void
  off(event, handler): void
}
```

Then swap it into `src/transport/MeshService.ts`. Recommended library: [`react-native-ble-plx`](https://github.com/dotintent/react-native-ble-plx).

---

## License

MIT
