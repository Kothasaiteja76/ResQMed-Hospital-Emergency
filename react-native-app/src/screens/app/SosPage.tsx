import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Vibration, Alert, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Siren, Phone, X, MapPin, Shield, CheckCircle2, AlertTriangle, Clock, ChevronRight, Navigation, Heart } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useSharedLocation } from '../../hooks/useSharedLocation';
import { createSosRequest, updateSosRequest, listenSosRequestDoc, listenAssignmentsForRequest, type SosRequestDoc, type SosAssignmentDoc } from '../../data/sos';
import { getUserProfile, type UserProfile } from '../../data/user';
import { formatEta, formatDistance } from '../../data/routing';
import { computeAgeFromDob, shortAddressFromProfile } from '../../data/user';

const { width } = Dimensions.get('window');
const COUNTDOWN_SECONDS = 10;

type Phase = 'idle' | 'countdown' | 'active' | 'helperEnroute' | 'helperReached' | 'resolved';

export const SosPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const { currentLocation, requestGPS } = useSharedLocation();

  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [request, setRequest] = useState<SosRequestDoc | null>(null);
  const [assignments, setAssignments] = useState<SosAssignmentDoc[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for SOS button
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [pulseScale]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
    }
  }, [user]);

  useEffect(() => {
    requestGPS({ silent: true });
  }, [requestGPS]);

  // Listen to SOS request changes
  useEffect(() => {
    if (!request?.id) return;
    const unsub = listenSosRequestDoc(request.id, (doc) => {
      if (!doc) return;
      setRequest(doc);
      if (doc.status === 'active' && phase === 'countdown') {
        setPhase('active');
        Vibration.vibrate([0, 300, 100, 300]);
      }
      if (doc.status === 'resolved' || doc.status === 'cancelled') {
        setPhase('resolved');
      }
    });
    return () => unsub();
  }, [request?.id, phase]);

  // Listen to assignments
  useEffect(() => {
    if (!request?.id) return;
    const unsub = listenAssignmentsForRequest(request.id, (items) => {
      setAssignments(items);
      const accepted = items.find((a) => a.status === 'accepted' || a.status === 'enroute');
      const reached = items.find((a) => a.status === 'reached');
      if (reached && phase !== 'resolved') setPhase('helperReached');
      else if (accepted && phase === 'active') setPhase('helperEnroute');
    });
    return () => unsub();
  }, [request?.id, phase]);

  const triggerSos = useCallback(async () => {
    if (!user) {
      nav.navigate('Login', { redirect: 'SOS' });
      return;
    }

    setPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    Vibration.vibrate([0, 200, 100, 200]);

    // Try to get GPS
    const loc = currentLocation ?? (await requestGPS({ silent: true }));

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          activateSos(loc);
          return 0;
        }
        Vibration.vibrate(100);
        return prev - 1;
      });
    }, 1000);
  }, [user, currentLocation, requestGPS]);

  const activateSos = async (loc: any) => {
    if (!user) return;
    setPhase('active');
    Vibration.vibrate([0, 500, 200, 500]);

    try {
      const brief = {
        name: profile?.name,
        age: profile?.dob ? computeAgeFromDob(profile.dob) : undefined,
        shortAddress: shortAddressFromProfile(profile),
        phone: profile?.phone,
      };

      const req = await createSosRequest({
        victimId: user.uid,
        status: 'active',
        severity: 'major',
        source: 'mobile',
        countdown: 0,
        location: loc ? { lat: loc.lat, lon: loc.lon } : null,
        hasValidLocation: !!loc,
        isApproximate: !loc,
        radiusKm: 5,
        victimBrief: brief,
      });
      setRequest(req);
    } catch (e: any) {
      setError(e?.message || 'Failed to create SOS');
    }
  };

  const cancelSos = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (request?.id) {
      await updateSosRequest(request.id, { status: 'cancelled' });
    }
    setPhase('idle');
    setRequest(null);
    setCountdown(COUNTDOWN_SECONDS);
    Vibration.cancel();
  };

  const markResolved = async () => {
    if (request?.id) {
      await updateSosRequest(request.id, { status: 'resolved' });
    }
    setPhase('resolved');
  };

  const activeHelper = assignments.find((a) => a.status === 'accepted' || a.status === 'enroute' || a.status === 'reached');

  if (phase === 'resolved') {
    return (
      <View style={[styles.container, styles.center]}>
        <CheckCircle2 size={64} color="#10b981" />
        <Text style={styles.resolvedTitle}>You're Safe</Text>
        <Text style={styles.resolvedDesc}>SOS has been resolved. Stay safe!</Text>
        <TouchableOpacity
          onPress={() => nav.navigate('MainTabs')}
          activeOpacity={0.85}
          style={styles.goHomeBtn}
        >
          <Text style={styles.goHomeBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cancel / Close */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => phase === 'idle' ? nav.goBack() : cancelSos()} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          {phase !== 'idle' && (
            <TouchableOpacity onPress={cancelSos} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel SOS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* IDLE state - big SOS button */}
        {phase === 'idle' && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.idleContainer}>
            <Text style={styles.idleLabel}>EMERGENCY SOS</Text>
            <Text style={styles.idleTitle}>Press & hold for help</Text>
            <Text style={styles.idleDesc}>
              This will alert nearby helpers within 5 km and share your GPS location.
            </Text>

            <Animated.View style={[styles.sosBtnOuter, pulseStyle]}>
              <TouchableOpacity
                onPress={triggerSos}
                onLongPress={triggerSos}
                activeOpacity={0.85}
                style={styles.sosBtn}
              >
                <Siren size={48} color="#ffffff" />
                <Text style={styles.sosBtnText}>SOS</Text>
              </TouchableOpacity>
            </Animated.View>

            {!currentLocation && (
              <View style={styles.noLocBanner}>
                <MapPin size={14} color="#f59e0b" />
                <Text style={styles.noLocText}>GPS not locked — location may be approximate</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* COUNTDOWN */}
        {phase === 'countdown' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>ACTIVATING SOS IN</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownDesc}>Tap cancel to abort</Text>
            <View style={styles.countdownBar}>
              <View style={[styles.countdownFill, { width: `${((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%` }]} />
            </View>
          </Animated.View>
        )}

        {/* ACTIVE / ENROUTE / REACHED */}
        {(phase === 'active' || phase === 'helperEnroute' || phase === 'helperReached') && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.activeContainer}>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: phase === 'helperReached' ? 'rgba(16,185,129,0.15)' : phase === 'helperEnroute' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)' }]}>
              {phase === 'helperReached' ? (
                <>
                  <CheckCircle2 size={20} color="#10b981" />
                  <View>
                    <Text style={styles.statusTitle}>Helper Has Arrived</Text>
                    <Text style={styles.statusDesc}>Help is here. Stay calm.</Text>
                  </View>
                </>
              ) : phase === 'helperEnroute' ? (
                <>
                  <Navigation size={20} color="#3b82f6" />
                  <View>
                    <Text style={styles.statusTitle}>Helper En Route</Text>
                    <Text style={styles.statusDesc}>
                      {activeHelper?.etaSeconds ? formatEta(activeHelper.etaSeconds) : 'On the way'}
                      {activeHelper?.distanceMeters ? ` · ${formatDistance(activeHelper.distanceMeters)}` : ''}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <AlertTriangle size={20} color="#ef4444" />
                  <View>
                    <Text style={styles.statusTitle}>SOS Active</Text>
                    <Text style={styles.statusDesc}>Broadcasting to nearby helpers…</Text>
                  </View>
                </>
              )}
            </View>

            {/* Helper card */}
            {activeHelper && (
              <View style={styles.helperCard}>
                <View style={styles.helperAvatar}>
                  <Heart size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helperName}>{activeHelper.helperName || 'Helper'}</Text>
                  <Text style={styles.helperStatus}>
                    {activeHelper.status === 'reached' ? 'Arrived' : 'Coming to help you'}
                  </Text>
                </View>
                {activeHelper.etaSeconds && activeHelper.status !== 'reached' ? (
                  <View style={styles.etaBadge}>
                    <Clock size={12} color="#3b82f6" />
                    <Text style={styles.etaText}>{formatEta(activeHelper.etaSeconds)}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Location info */}
            {currentLocation && (
              <View style={styles.locCard}>
                <MapPin size={14} color="#10b981" />
                <Text style={styles.locText}>
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
                </Text>
              </View>
            )}

            {/* Mark safe */}
            {(phase === 'helperReached' || phase === 'active') && (
              <TouchableOpacity onPress={markResolved} activeOpacity={0.85} style={styles.safeBtn}>
                <Shield size={18} color="#ffffff" />
                <Text style={styles.safeBtnText}>I'm Safe Now</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40, minHeight: '100%' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  cancelText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
  // Idle
  idleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  idleLabel: { fontSize: 10, fontWeight: '900', color: '#ef4444', letterSpacing: 3 },
  idleTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff', marginTop: 8, textAlign: 'center' },
  idleDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  sosBtnOuter: { marginTop: 40, marginBottom: 40 },
  sosBtn: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#0e0f14',
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 20,
  },
  sosBtnText: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 4, marginTop: 4 },
  noLocBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  noLocText: { color: '#f59e0b', fontSize: 11, flex: 1 },
  // Countdown
  countdownContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  countdownLabel: { fontSize: 11, fontWeight: '900', color: '#ef4444', letterSpacing: 3 },
  countdownNumber: { fontSize: 120, fontWeight: '900', color: '#ef4444', lineHeight: 130 },
  countdownDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  countdownBar: { width: '80%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 24, overflow: 'hidden' },
  countdownFill: { height: '100%', backgroundColor: '#ef4444', borderRadius: 2 },
  // Active
  activeContainer: { gap: 12 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statusTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  statusDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  helperCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  helperAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center' },
  helperName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  helperStatus: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  etaText: { color: '#3b82f6', fontSize: 12, fontWeight: '800' },
  locCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  locText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  safeBtn: {
    height: 52, borderRadius: 26, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6,
  },
  safeBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  // Resolved
  resolvedTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff', marginTop: 20 },
  resolvedDesc: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8 },
  goHomeBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  goHomeBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});
