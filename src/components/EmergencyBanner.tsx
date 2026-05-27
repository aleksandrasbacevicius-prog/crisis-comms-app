import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrisisMessage, PRIORITY_LABELS, MessagePriority } from '../protocol/types';
import { useStore } from '../store';

interface Props {
  message: CrisisMessage;
}

export function EmergencyBanner({ message }: Props) {
  const dismissAlert = useStore(s => s.dismissAlert);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(8000),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => dismissAlert());
  }, [message.id]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <MaterialCommunityIcons name="alert-octagon" size={22} color="#fff" />
      <View style={styles.text}>
        <Text style={styles.label}>{PRIORITY_LABELS[message.priority as MessagePriority]}</Text>
        <Text style={styles.body} numberOfLines={2}>{message.payload}</Text>
        <Text style={styles.meta}>from {message.senderAlias} · {message.relayPath.length} hops</Text>
      </View>
      <TouchableOpacity onPress={dismissAlert}>
        <MaterialCommunityIcons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FF2D2D',
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, paddingTop: 50, gap: 10, zIndex: 999,
  },
  text: { flex: 1 },
  label: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
  body: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
});
