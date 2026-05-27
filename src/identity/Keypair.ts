import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

const KEYPAIR_KEY = 'crisis_comms_keypair';
const ALIAS_KEY = 'crisis_comms_alias';

export interface StoredKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  publicKeyB64: string;
}

let _cachedKeypair: StoredKeypair | null = null;

export async function getOrCreateKeypair(): Promise<StoredKeypair> {
  if (_cachedKeypair) return _cachedKeypair;

  const stored = await SecureStore.getItemAsync(KEYPAIR_KEY);
  if (stored) {
    const { pk, sk } = JSON.parse(stored);
    _cachedKeypair = {
      publicKey: decodeBase64(pk),
      secretKey: decodeBase64(sk),
      publicKeyB64: pk,
    };
    return _cachedKeypair;
  }

  const pair = nacl.sign.keyPair();
  const pk = encodeBase64(pair.publicKey);
  const sk = encodeBase64(pair.secretKey);
  await SecureStore.setItemAsync(KEYPAIR_KEY, JSON.stringify({ pk, sk }));
  _cachedKeypair = { publicKey: pair.publicKey, secretKey: pair.secretKey, publicKeyB64: pk };
  return _cachedKeypair;
}

export async function getAlias(): Promise<string> {
  const stored = await SecureStore.getItemAsync(ALIAS_KEY);
  return stored ?? 'Anonymous';
}

export async function setAlias(alias: string): Promise<void> {
  await SecureStore.setItemAsync(ALIAS_KEY, alias);
}

export function signMessage(message: string, secretKey: Uint8Array): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const sig = nacl.sign.detached(data, secretKey);
  return encodeBase64(sig);
}

export function verifyMessage(message: string, signature: string, publicKeyB64: string): boolean {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const sig = decodeBase64(signature);
    const pk = decodeBase64(publicKeyB64);
    return nacl.sign.detached.verify(data, sig, pk);
  } catch {
    return false;
  }
}

export function signingPayload(msg: {
  id: string; type: string; priority: number; channel: string;
  senderPubkey: string; payload: string; timestamp: number;
}): string {
  return [msg.id, msg.type, msg.priority, msg.channel, msg.senderPubkey, msg.payload, msg.timestamp].join('|');
}
