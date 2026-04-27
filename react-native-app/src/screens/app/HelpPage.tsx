import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HandHeart, MapPin, Clock, ChevronLeft, AlertTriangle, Navigation, CheckCircle2, Phone, Shield, Siren } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useSharedLocation } from '../../hooks/useSharedLocation';
import { useHelperLiveTracking } from '../../hooks/useHelperLiveTracking';
import { listenActiveSosRequests, acceptSosRequest, listenMyAssignment, updateSosRequest, type SosRequestDoc, type SosAssignmentDoc } from '../../data/sos';
import { getUserProfile, type UserProfile, computeAgeFromDob, shortAddressFromProfile } from '../../data/user';
import { haversineMeters, formatEta, formatDistance } from '../../data/routing';

type HelpPhase = 'browse' | 'enroute' | 'reached';

export const HelpPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { currentLocation, requestGPS } = useSharedLocation();
  const [activeRequests, setActiveRequests] = useState<SosRequestDoc[]>([]);
  const [acceptedRequest, setAcceptedRequest] = useState<SosRequestDoc | null>(null);
  const [assignment, setAssignment] = useState<SosAssignmentDoc | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<HelpPhase>('browse');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    requestGPS({ silent: true });
  }, [requestGPS]);

  useEffect(() => {
    if (user) getUserProfile(user.uid).then(setProfile);
  }, [user]);

  // Listen for active SOS requests
  useEffect(() => {
    const unsub = listenActiveSosRequests((requests) => {
      if (!user) return;
      // Filter out own requests
      const filtered = requests.filter((r) => r.victimId !== user.uid);
      setActiveRequests(filtered);
    });
    return () => unsub();
  }, [user]);

  // Listen to assignment when accepted
  useEffect(() => {
    if (!acceptedRequest?.id || !user?.uid) return;
    const unsub = listenMyAssignment(acceptedRequest.id, user.uid, (a) => {
      setAssignment(a);
      if (a?.status === 'reached') setPhase('reached');
      else if (a?.status === 'enroute' || a?.status === 'accepted') setPhase('enroute');
    });
    return () => unsub();
  }, [acceptedRequest?.id, user?.uid]);

  // Live tracking for helper
  useHelperLiveTracking({
    assignmentId: assignment?.id ?? null,
    victimLocation: acceptedRequest?.location ?? null,
    active: phase === 'enroute' && !!assignment,
  });

  const handleAccept = useCallback(async (request: SosRequestDoc) => {
    if (!user) {
      nav.navigate('Login', { redirect: 'Help' });
      return;
    }
    setBusy(true);
    try {
      const brief = {
        name: profile?.name,
        age: profile?.dob ? computeAgeFromDob(profile.dob) : undefined,
        shortAddress: shortAddressFromProfile(profile),
        phone: profile?.phone,
      };
      const assignId = await acceptSosRequest(request.id, user.uid, profile?.name, brief);
      setAcceptedRequest(request);
      setPhase('enroute');
      Vibration.vibrate([0, 200, 100, 200]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not accept this SOS');
    } finally {
      setBusy(false);
    }
  }, [user, profile, nav]);

  const markResolved = async () => {
    if (acceptedRequest?.id) {
      await updateSosRequest(acceptedRequest.id, { status: 'resolved' });
    }
    setPhase('browse');
    setAcceptedRequest(null);
    setAssignment(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.headerBadge}>
              <HandHeart size={14} color="#10b981" />
              <Text style={styles.headerBadgeText}>I CAN HELP</Text>
            </View>
            <Text style={styles.headerTitle}>Nearby Emergencies</Text>
          </View>
        </View>

        {/* Enroute / Reached banner */}
        {(phase === 'enroute' || phase === 'reached') && acceptedRequest && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={[styles.banner, { backgroundColor: phase === 'reached' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)' }]}>
              {phase === 'reached' ? (
                <>
                  <CheckCircle2 size={24} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>You've Arrived</Text>
                    <Text style={styles.bannerDesc}>You're at the victim's location. Help them!</Text>
                  </View>
                </>
              ) : (
                <>
                  <Navigation size={24} color="#3b82f6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>En Route to Victim</Text>
                    <Text style={styles.bannerDesc}>
                      {assignment?.etaSeconds ? `ETA: ${formatEta(assignment.etaSeconds)}` : 'Navigating…'}
                      {assignment?.distanceMeters ? ` · ${formatDistance(assignment.distanceMeters)}` : ''}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Victim info */}
            {acceptedRequest.victimBrief && (
              <View style={styles.victimCard}>
                <View style={styles.victimAvatar}>
                  <Siren size={18} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.victimName}>{acceptedRequest.victimBrief.name || 'Victim'}</Text>
                  <Text style={styles.victimDetails}>
                    {acceptedRequest.victimBrief.age ? `${acceptedRequest.victimBrief.age} yrs` : ''}
                    {acceptedRequest.severity ? ` · ${acceptedRequest.severity}` : ''}
                  </Text>
                </View>
                {acceptedRequest.victimBrief.phone && (
                  <TouchableOpacity style={styles.callBtn} activeOpacity={0.7}>
                    <Phone size={14} color="#10b981" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity onPress={markResolved} activeOpacity={0.85} style={styles.resolveBtn}>
              <Shield size={16} color="#ffffff" />
              <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Browse SOS requests */}
        {phase === 'browse' && (
          <>
            {!user && (
              <View style={styles.loginBanner}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.loginText}>Log in to see and accept nearby SOS requests.</Text>
                <TouchableOpacity onPress={() => nav.navigate('Login', {})} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Log in →</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeRequests.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyCard}>
                <HandHeart size={32} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyTitle}>No active emergencies</Text>
                <Text style={styles.emptyDesc}>When someone nearby triggers an SOS, it will appear here.</Text>
              </Animated.View>
            ) : (
              <View style={styles.requestList}>
                {activeRequests.map((req, i) => {
                  const dist = currentLocation && req.location
                    ? haversineMeters(
                        { lat: currentLocation.lat, lon: currentLocation.lon },
                        req.location,
                      )
                    : null;

                  return (
                    <Animated.View
                      key={req.id}
                      entering={FadeInDown.duration(400).delay(i * 80)}
                    >
                      <View style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                          <View style={[styles.severityBadge, { backgroundColor: req.severity === 'critical' ? 'rgba(239,68,68,0.2)' : req.severity === 'major' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }]}>
                            <AlertTriangle size={12} color={req.severity === 'critical' ? '#ef4444' : req.severity === 'major' ? '#f59e0b' : '#10b981'} />
                            <Text style={[styles.severityText, { color: req.severity === 'critical' ? '#ef4444' : req.severity === 'major' ? '#f59e0b' : '#10b981' }]}>
                              {req.severity?.toUpperCase()}
                            </Text>
                          </View>
                          {dist !== null && (
                            <View style={styles.distBadge}>
                              <MapPin size={10} color="rgba(255,255,255,0.4)" />
                              <Text style={styles.distText}>{formatDistance(dist)}</Text>
                            </View>
                          )}
                        </View>

                        {req.victimBrief?.name && (
                          <Text style={styles.requestName}>{req.victimBrief.name}</Text>
                        )}
                        {req.symptomNotes && (
                          <Text style={styles.requestNotes}>{req.symptomNotes}</Text>
                        )}

                        <TouchableOpacity
                          onPress={() => handleAccept(req)}
                          disabled={busy}
                          activeOpacity={0.85}
                          style={[styles.acceptBtn, busy && { opacity: 0.5 }]}
                        >
                          <HandHeart size={16} color="#ffffff" />
                          <Text style={styles.acceptBtnText}>Accept & Help</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBadgeText: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  bannerTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  bannerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  victimCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  victimAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' },
  victimName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  victimDetails: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center' },
  resolveBtn: { height: 48, borderRadius: 24, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  resolveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  loginBanner: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginBottom: 16, gap: 8 },
  loginText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  loginLink: { alignSelf: 'flex-start' },
  loginLinkText: { color: '#f59e0b', fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#13141a', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 260 },
  requestList: { gap: 10 },
  requestCard: { backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  distText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  requestName: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  requestNotes: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  acceptBtn: { height: 44, borderRadius: 22, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  acceptBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
