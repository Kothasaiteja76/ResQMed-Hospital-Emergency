import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Vibration } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Siren, MapPin, Clock, X, HandHeart, AlertTriangle, Navigation } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';
import { listenActiveSosRequests, acceptSosRequest, type SosRequestDoc, type ParticipantBrief } from '../data/sos';
import { getUserProfile, computeAgeFromDob, shortAddressFromProfile } from '../data/user';
import { useSharedLocation } from '../hooks/useSharedLocation';
import { getDistance } from '../lib/distance';
import { getItem, setItem, sessionGetItem, sessionSetItem } from '../lib/storage';

const IGNORE_KEY = 'arogya_sos_ignored_v1';
const HELPER_MODE_KEY = 'arogya_helper_mode_enabled';
const SNOOZE_UNTIL_KEY = 'arogya_sos_snooze_until';
const POPUP_RADIUS_KM = 5.0;
const AUTO_DISMISS_SECONDS = 30;

function loadSessionIgnores(): Set<string> {
  try {
    const raw = sessionGetItem(IGNORE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveSessionIgnores(ids: Set<string>) {
  sessionSetItem(IGNORE_KEY, JSON.stringify([...ids]));
}

export const isHelperModeEnabled = (): boolean => {
  // sync read from cache
  const { getItemSync } = require('../lib/storage');
  const raw = getItemSync(HELPER_MODE_KEY);
  return raw === null ? true : raw === 'true';
};

export const setHelperModeEnabled = (v: boolean) => {
  setItem(HELPER_MODE_KEY, v ? 'true' : 'false');
};

export const IncomingSosOverlay = () => {
  const { user } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { currentLocation } = useSharedLocation();
  const [feed, setFeed] = useState<SosRequestDoc[]>([]);
  const [activeReq, setActiveReq] = useState<SosRequestDoc | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS);
  const [accepting, setAccepting] = useState(false);
  const ignoresRef = useRef<Set<string>>(loadSessionIgnores());

  const isBlocked = useMemo(() => {
    const name = route.name;
    return ['SOS', 'AdminPanel', 'Login', 'Signup', 'Landing'].includes(name);
  }, [route.name]);

  useEffect(() => {
    if (!user?.uid) return;
    return listenActiveSosRequests((data) => {
      const now = Date.now();
      const fresh = data.filter((r) =>
        r.victimId !== user.uid &&
        ((r as any)._createdMs ? now - (r as any)._createdMs < 30 * 60 * 1000 : true)
      );
      setFeed(fresh);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    if (isBlocked) return;
    if (!isHelperModeEnabled()) return;
    if (activeReq) return;
    if (!currentLocation) return;

    const candidates = feed
      .filter((r) => r.location && r.hasValidLocation !== false)
      .filter((r) => !(r.helpersAccepted ?? []).includes(user.uid))
      .filter((r) => !ignoresRef.current.has(r.id))
      .map((r) => ({
        req: r,
        dist: r.location ? getDistance(
          currentLocation.lat, currentLocation.lon,
          r.location.lat, r.location.lon,
        ) : Infinity,
      }))
      .filter((x) => x.dist <= POPUP_RADIUS_KM)
      .sort((a, b) => {
        const sa = a.req.severity === 'critical' ? 0 : 1;
        const sb = b.req.severity === 'critical' ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return a.dist - b.dist;
      });

    const pick = candidates[0]?.req ?? null;
    if (pick) {
      setActiveReq(pick);
      setSecondsLeft(AUTO_DISMISS_SECONDS);
      Vibration.vibrate([200, 100, 200]);
    }
  }, [feed, user?.uid, isBlocked, currentLocation, activeReq]);

  useEffect(() => {
    if (!activeReq) return;
    if (secondsLeft <= 0) {
      dismiss('auto');
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [activeReq, secondsLeft]);

  const dismiss = (_reason: 'user' | 'auto') => {
    if (!activeReq) return;
    ignoresRef.current.add(activeReq.id);
    saveSessionIgnores(ignoresRef.current);
    setActiveReq(null);
  };

  const snoozeFiveMinutes = () => {
    setItem(SNOOZE_UNTIL_KEY, String(Date.now() + 5 * 60 * 1000));
    dismiss('user');
  };

  const accept = async () => {
    if (!activeReq || !user || !currentLocation || accepting) return;
    setAccepting(true);
    try {
      let hp = null as Awaited<ReturnType<typeof getUserProfile>>;
      try { hp = await getUserProfile(user.uid); } catch {}
      const helperBrief: ParticipantBrief = {
        name: user.displayName || hp?.name || 'Helper',
        age: hp ? computeAgeFromDob(hp.dob) : undefined,
        shortAddress: shortAddressFromProfile(hp) ?? currentLocation.displayName,
        phone: hp?.phone,
      };
      await acceptSosRequest({
        requestId: activeReq.id,
        victimId: activeReq.victimId,
        helperId: user.uid,
        helperName: user.displayName || 'Helper',
        helperBrief,
        helperLocation: { lat: currentLocation.lat, lon: currentLocation.lon },
      });
    } catch {}
    finally {
      setAccepting(false);
      setActiveReq(null);
      nav.navigate('Help');
    }
  };

  if (!activeReq || isBlocked) return null;

  const dist = activeReq.location && currentLocation ? getDistance(
    currentLocation.lat, currentLocation.lon,
    activeReq.location.lat, activeReq.location.lon,
  ) : null;
  const distLabel = dist === null ? '—'
    : dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;

  const createdMs = (activeReq as any)._createdMs as number | undefined;
  const minsAgo = createdMs ? Math.max(0, Math.floor((Date.now() - createdMs) / 60000)) : 0;

  const severity = activeReq.severity;
  const severityColor = severity === 'critical' ? '#ef4444' : severity === 'major' ? '#f59e0b' : '#10b981';
  const severityLabel = severity === 'critical' ? 'High priority' : severity === 'major' ? 'Medium priority' : 'Low priority';

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.scrim}>
        <View style={[styles.sheet, { borderColor: `${severityColor}50` }]}>
          {/* Header */}
          <View style={styles.topRow}>
            <View style={[styles.sirenIcon, { backgroundColor: severityColor }]}>
              <Siren size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.severityLabel, { color: severityColor }]}>{severityLabel}</Text>
              <Text style={styles.heroTitle}>Emergency nearby</Text>
              <Text style={styles.heroDesc}>Someone needs help — you're the closest volunteer.</Text>
            </View>
            <TouchableOpacity onPress={() => dismiss('user')} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatChip icon={<MapPin size={14} color="#7dd3fc" />} label="Distance" value={distLabel} />
            <StatChip icon={<Clock size={14} color="#fcd34d" />} label="Raised" value={minsAgo < 1 ? 'Just now' : `${minsAgo} min ago`} />
            <StatChip icon={<Navigation size={14} color="#6ee7b7" />} label="Source" value={activeReq.source === 'hardware' ? 'Crash sensor' : 'Manual'} />
          </View>

          {/* Location */}
          {activeReq.location && (
            <View style={styles.locRow}>
              <MapPin size={14} color="#ef4444" />
              <Text style={styles.locText}>
                Lat {activeReq.location.lat.toFixed(4)}, Lon {activeReq.location.lon.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Timer */}
          <View style={styles.timerRow}>
            <Text style={styles.timerText}>Auto-dismiss in {secondsLeft}s</Text>
            <TouchableOpacity onPress={snoozeFiveMinutes}>
              <Text style={styles.snoozeText}>Snooze 5 min</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timerBar}>
            <View style={[styles.timerFill, { width: `${(secondsLeft / AUTO_DISMISS_SECONDS) * 100}%`, backgroundColor: severityColor }]} />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => dismiss('user')} style={styles.declineBtn} activeOpacity={0.7}>
              <Text style={styles.declineText}>Can't help</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={accept} disabled={accepting} activeOpacity={0.85} style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}>
              <HandHeart size={16} color="#ffffff" />
              <Text style={styles.acceptText}>{accepting ? 'Accepting…' : 'I can help now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const StatChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.statChip}>
    {icon}
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', padding: 16 },
  sheet: { borderRadius: 24, borderWidth: 1, backgroundColor: '#13141a', overflow: 'hidden', paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingBottom: 0 },
  sirenIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  severityLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  heroDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 20 },
  statChip: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.3)', padding: 10 },
  locText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 20 },
  timerText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  snoozeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  timerBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, marginTop: 4, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  declineBtn: { height: 48, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  declineText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  acceptBtn: { flex: 1, height: 48, borderRadius: 16, backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  acceptText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
