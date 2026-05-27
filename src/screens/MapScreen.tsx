// DIAGNOSTIC: expo-location added back
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

export function MapScreen() {
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shelters</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 18 },
});
