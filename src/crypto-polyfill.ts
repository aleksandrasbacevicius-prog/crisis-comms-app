/**
 * Polyfill crypto.getRandomValues for tweetnacl using expo-crypto.
 * expo-crypto is bundled in Expo Go; react-native-get-random-values is not.
 * Must be imported before any module that imports tweetnacl.
 */
import * as Crypto from 'expo-crypto';

if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}
if (typeof (global.crypto as any).getRandomValues === 'undefined') {
  (global as any).crypto.getRandomValues = <T extends ArrayBufferView>(array: T): T =>
    Crypto.getRandomValues(array as unknown as Uint8Array) as unknown as T;
}
