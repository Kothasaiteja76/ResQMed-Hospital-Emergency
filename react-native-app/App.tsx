import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/app/ThemeContext';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { initStorage } from './src/lib/storage';

const PRELOAD_KEYS = [
  'arogya_raksha_location',
  'arogya_gps_ever_granted',
  'ar_theme',
  'resqmed_demo_user_v1',
];

function AppContent() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.splashText}>Arogya Raksha</Text>
      </View>
    );
  }

  return (
    <>
      <OfflineBanner />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    initStorage(PRELOAD_KEYS).then(() => setStorageReady(true));
  }, []);

  if (!storageReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0a0b0f" />
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0a0b0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
  },
});
