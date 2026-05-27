import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../store';
import { MessageBubble } from '../components/MessageBubble';
import { sendMessage } from '../transport/MeshService';
import { getMessagesForChannel } from '../storage/MessageStore';
import { CrisisMessage, MessagePriority } from '../protocol/types';

export function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channels = useStore(s => s.channels);
  const messages = useStore(s => s.messages[id] ?? []);
  const peers = useStore(s => s.peers);
  const clearUnread = useStore(s => s.clearUnread);
  const addMessage = useStore(s => s.addMessage);
  const channel = channels.find(c => c.id === id);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    clearUnread(id);
    getMessagesForChannel(id).then(stored => {
      stored.forEach(m => addMessage(m));
    });
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !channel) return;
    setText('');
    await sendMessage(id, trimmed, channel.defaultPriority);
  }, [text, id, channel]);

  if (!channel) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#eee" />
        </TouchableOpacity>
        <View style={[styles.dot, { backgroundColor: channel.color }]} />
        <Text style={styles.title}>{channel.name}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble message={item} peers={peers} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name={channel.icon as any} size={40} color={channel.color} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptyHint}>{channel.description}</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#444"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? channel.color : '#222' }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  back: { marginRight: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { color: '#fff', fontWeight: '700', fontSize: 17 },
  list: { paddingVertical: 12, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptyHint: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#1a1a2e',
  },
  input: {
    flex: 1, backgroundColor: '#1a1a2e', color: '#eee',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 120,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
