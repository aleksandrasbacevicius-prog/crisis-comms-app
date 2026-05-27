// DIAGNOSTIC: bare minimum — no expo-location, no JSON
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function MapScreen() {
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
