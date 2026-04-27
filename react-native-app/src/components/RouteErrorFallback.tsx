import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as Updates from 'expo-updates';

type Props = {
  error?: Error | string | null;
};

export const RouteErrorFallback = ({ error }: Props) => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Something went wrong';

  const isFirestore =
    /firestore|INTERNAL ASSERTION|Unexpected state/i.test(msg) ||
    (error instanceof Error && /firestore/i.test(error.stack || ''));

  const reload = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // Updates not available in dev
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <AlertTriangle size={28} color="#fbbf24" />
        </View>
        <Text style={styles.title}>We hit a snag</Text>
        <Text style={styles.desc}>
          {isFirestore
            ? 'A realtime sync glitch occurred. Reloading usually fixes it.'
            : 'The app ran into an unexpected error.'}
        </Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{msg}</Text>
        </View>
        <TouchableOpacity onPress={reload} style={styles.reloadBtn} activeOpacity={0.85}>
          <RefreshCw size={16} color="#0f172a" />
          <Text style={styles.reloadText}>Reload app</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('MainTabs')} style={styles.homeBtn} activeOpacity={0.7}>
          <Home size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.homeText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 400, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#13141a', padding: 24, alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  errorBox: { marginTop: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, width: '100%', maxHeight: 100 },
  errorText: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' },
  reloadBtn: { width: '100%', height: 44, borderRadius: 16, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  reloadText: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  homeBtn: { width: '100%', height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  homeText: { fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.8)' },
});
