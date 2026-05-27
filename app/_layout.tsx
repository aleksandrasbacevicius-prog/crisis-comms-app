import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../src/store';
import { startMeshService } from '../src/transport/MeshService';
import { EmergencyBanner } from '../src/components/EmergencyBanner';

export default function RootLayout() {
  const simServerUrl = useStore(s => s.simServerUrl);
  const activeAlert = useStore(s => s.activeAlert);

  useEffect(() => {
    startMeshService(simServerUrl);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      {activeAlert && <EmergencyBanner message={activeAlert} />}
    </View>
  );
}
