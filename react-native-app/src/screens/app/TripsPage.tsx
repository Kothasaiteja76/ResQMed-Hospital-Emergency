import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Vibration, Alert } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Route, Play, Square, Clock, MapPin, Navigation, Shield, AlertTriangle, HardHat, Activity, Zap, Gauge } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { useSharedLocation } from '../../hooks/useSharedLocation';
import { listenHelmet, type HelmetDevice } from '../../data/helmet';
import { haversineMeters } from '../../data/routing';

type TripPhase = 'idle' | 'tracking' | 'paused';

interface TripStats {
  distanceMeters: number;
  durationSeconds: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  points: { lat: number; lon: number; ts: number }[];
}

export const TripsPage = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { currentLocation, requestGPS } = useSharedLocation();
  const [phase, setPhase] = useState<TripPhase>('idle');
  const [stats, setStats] = useState<TripStats>({
    distanceMeters: 0, durationSeconds: 0, maxSpeedKmh: 0, avgSpeedKmh: 0, points: [],
  });
  const [helmet, setHelmet] = useState<HelmetDevice | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (user) {
      return listenHelmet(user.uid, setHelmet);
    }
  }, [user]);

  const startTrip = async () => {
    const loc = await requestGPS({ showAlert: true });
    if (!loc) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to track your ride.');
      return;
    }

    setPhase('tracking');
    setStats({ distanceMeters: 0, durationSeconds: 0, maxSpeedKmh: 0, avgSpeedKmh: 0, points: [{ lat: loc.lat, lon: loc.lon, ts: Date.now() }] });

    timerRef.current = setInterval(() => {
      setStats((s) => ({ ...s, durationSeconds: s.durationSeconds + 1 }));
    }, 1000);

    subRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
      (pos) => {
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() };
        setStats((s) => {
          const lastPt = s.points[s.points.length - 1];
          if (!lastPt) return { ...s, points: [here] };
          const dist = haversineMeters({ lat: lastPt.lat, lon: lastPt.lon }, { lat: here.lat, lon: here.lon });
          const timeDiff = (here.ts - lastPt.ts) / 1000;
          const speedKmh = timeDiff > 0 ? (dist / timeDiff) * 3.6 : 0;
          const newDist = s.distanceMeters + dist;
          const totalTime = s.durationSeconds || 1;
          return {
            ...s,
            distanceMeters: newDist,
            maxSpeedKmh: Math.max(s.maxSpeedKmh, speedKmh),
            avgSpeedKmh: (newDist / totalTime) * 3.6,
            points: [...s.points, here],
          };
        });
      },
    );
  };

  const stopTrip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (subRef.current) { subRef.current.remove(); subRef.current = null; }
    setPhase('idle');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (subRef.current) subRef.current.remove();
    };
  }, []);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const formatDist = (m: number) => {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.headerBadge}>
            <Route size={14} color="#06b6d4" />
            <Text style={styles.headerBadgeText}>RIDE TRACKER</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Your Rides</Text>
        </Animated.View>

        {/* Helmet status */}
        {helmet && (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <View style={styles.helmetBanner}>
              <HardHat size={16} color="#8b5cf6" />
              <Text style={styles.helmetText}>{helmet.model}</Text>
              <View style={[styles.dotIndicator, { backgroundColor: helmet.connected ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.helmetStatus}>{helmet.connected ? 'Connected' : 'Offline'}</Text>
            </View>
          </Animated.View>
        )}

        {/* Trip controls */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {phase === 'idle' ? (
            <TouchableOpacity onPress={startTrip} activeOpacity={0.85} style={styles.startBtn}>
              <Play size={20} color="#ffffff" />
              <Text style={styles.startBtnText}>Start Ride</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.tripCard}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>TRACKING</Text>
              </View>

              <View style={styles.statsGrid}>
                <StatBox icon={Clock} label="Duration" value={formatDuration(stats.durationSeconds)} color="#06b6d4" />
                <StatBox icon={Navigation} label="Distance" value={formatDist(stats.distanceMeters)} color="#10b981" />
                <StatBox icon={Gauge} label="Max Speed" value={`${stats.maxSpeedKmh.toFixed(0)} km/h`} color="#f59e0b" />
                <StatBox icon={Activity} label="Avg Speed" value={`${stats.avgSpeedKmh.toFixed(0)} km/h`} color="#8b5cf6" />
              </View>

              <TouchableOpacity onPress={stopTrip} activeOpacity={0.85} style={styles.stopBtn}>
                <Square size={16} color="#ffffff" />
                <Text style={styles.stopBtnText}>Stop Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Empty state */}
        {phase === 'idle' && stats.durationSeconds === 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.emptyCard}>
            <Route size={32} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptyDesc}>Start a ride to track your distance, speed, and route with crash detection.</Text>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const StatBox = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <View style={styles.statBox}>
    <Icon size={14} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBadgeText: { fontSize: 10, fontWeight: '900', color: '#06b6d4', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 4, marginBottom: 16 },
  helmetBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)', marginBottom: 12 },
  helmetText: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '700' },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  helmetStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  startBtn: { height: 56, borderRadius: 28, backgroundColor: '#06b6d4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  startBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  tripCard: { backgroundColor: '#13141a', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#ef4444', letterSpacing: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statBox: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12, gap: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900' },
  stopBtn: { height: 48, borderRadius: 24, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stopBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  emptyCard: { alignItems: 'center', backgroundColor: '#13141a', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 280, lineHeight: 18 },
});
