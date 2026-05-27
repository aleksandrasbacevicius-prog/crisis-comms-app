import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { setAlias } from '../identity/Keypair';
import { stopMeshService, startMeshService } from '../transport/MeshService';

export function SettingsScreen() {
  const { myAlias, myPubkey, simServerUrl, isConnected, setAlias: storeSetAlias, setSimServerUrl } = useStore();
  const [aliasInput, setAliasInput] = useState(myAlias);
  const [serverInput, setServerInput] = useState(simServerUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setAliasInput(myAlias); }, [myAlias]);

  const saveAlias = async () => {
    const trimmed = aliasInput.trim();
    if (!trimmed) return;
    setSaving(true);
    await setAlias(trimmed);
    storeSetAlias(trimmed);
    setSaving(false);
    Alert.alert('Saved', 'Display name updated.');
  };

  const reconnect = async () => {
    stopMeshService();
    setSimServerUrl(serverInput.trim());
    await startMeshService(serverInput.trim());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      <Text style={styles.sectionLabel}>IDENTITY</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={aliasInput}
          onChangeText={setAliasInput}
          placeholder="Your name"
          placeholderTextColor="#444"
          maxLength={32}
        />
        <TouchableOpacity style={styles.btn} onPress={saveAlias} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Public Key (Ed25519)</Text>
        <Text style={styles.keyText} numberOfLines={2}>{myPubkey || '—'}</Text>
        <Text style={styles.hint}>This key signs every message you send. Share it with others to prove your identity.</Text>
      </View>

      <Text style={styles.sectionLabel}>MESH SIMULATOR</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Relay Server URL</Text>
        <TextInput
          style={styles.input}
          value={serverInput}
          onChangeText={setServerInput}
          placeholder="ws://192.168.x.x:8765"
          placeholderTextColor="#444"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.btn} onPress={reconnect}>
          <Text style={styles.btnText}>Reconnect</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Run `npm run sim` on a machine on the same LAN. All devices connect to this URL.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.card}>
        <Text style={styles.about}>
          CrisisComms — offline-first proximity mesh communication for civil emergencies.{'\n\n'}
          Messages are signed with Ed25519, relay up to {7} hops, and survive up to 24 hours in store-and-forward queues.{'\n\n'}
          Transport: Simulated (WebSocket relay). Replace with BluetoothLETransport or WiFiDirectTransport for production.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { paddingBottom: 60 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 60, marginBottom: 20 },
  sectionLabel: { color: '#444', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 16, paddingVertical: 8 },
  card: { backgroundColor: '#1a1a2e', marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 12, gap: 8 },
  label: { color: '#888', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#0d0d1a', color: '#eee', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  btn: {
    backgroundColor: '#4FC3F7', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  keyText: { color: '#555', fontSize: 11, fontFamily: 'monospace' },
  hint: { color: '#555', fontSize: 12 },
  about: { color: '#666', fontSize: 13, lineHeight: 20 },
});
