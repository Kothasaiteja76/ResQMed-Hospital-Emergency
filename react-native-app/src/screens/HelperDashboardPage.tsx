import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HandHeart, MapPin, Clock, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';
import {
  listenActiveSosRequests,
  acceptSosRequest,
  type SosRequestDoc,
  type ParticipantBrief,
} from '../data/sos';
import { getUserProfile, computeAgeFromDob, shortAddressFromProfile } from '../data/user';
import { useSharedLocation } from '../hooks/useSharedLocation';
import { haversineKm } from '../lib/distance';

const URGENCY_COLORS: Record<string, { border: string; bg: string; text: string; label: string }> = {
  critical: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.07)', text: '#fca5a5', label: 'Critical' },
  major:    { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.07)', text: '#fcd34d', label: 'Major' },
  low:      { border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.07)', text: '#6ee7b7', label: 'Low' },
};

const LEADERBOARD_DEMO = [
  { rank: 1, name: 'Arjun M.', helped: 42, points: 2180 },
  { rank: 2, name: 'Priya S.', helped: 38, points: 1920 },
  { rank: 3, name: 'Ravi K.', helped: 29, points: 1540 },
  { rank: 4, name: 'Meera J.', helped: 21, points: 1100 },
  { rank: 5, name: 'Karthik B.', helped: 15, points: 820 },
];

export const HelperDashboardPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { currentLocation } = useSharedLocation();
  const [feed, setFeed] = useState<SosRequestDoc[]>([]);
  const [tab, setTab] = useState<'need-help' | 'leaderboard'>('need-help');
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [tooFarWarning, setTooFarWarning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const helperLat = currentLocation?.lat ?? null;
  const helperLon = currentLocation?.lon ?? null;
  const locStatus = currentLocation ? 'ok' : 'loading';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user?.uid) return;
    return listenActiveSosRequests(setFeed);
  }, [user?.uid]);

  const visibleFeed = useMemo(() => {
    return feed.filter((r) => {
      if (!r.hasValidLocation) return false;
      if (helperLat === null || helperLon === null || !r.location) return true;
      return haversineKm(helperLat, helperLon, r.location.lat, r.location.lon) <= 5;
    });
  }, [feed, helperLat, helperLon]);

  const handleHelpNow = async (req: SosRequestDoc) => {
    if (!user) return;
    if (helperLat === null || helperLon === null) {
      showToast('Enable location to accept.');
      return;
    }
    try {
      let hp = null as Awaited<ReturnType<typeof getUserProfile>>;
      try { hp = await getUserProfile(user.uid); } catch {}
      const helperBrief: ParticipantBrief = {
        name: user.displayName || hp?.name || 'Helper',
        age: hp ? computeAgeFromDob(hp.dob) : undefined,
        shortAddress: shortAddressFromProfile(hp),
        phone: hp?.phone,
      };
      await acceptSosRequest({
        requestId: req.id,
        victimId: req.victimId,
        helperId: user.uid,
        helperName: user.displayName || 'Helper',
        helperBrief,
        helperLocation: { lat: helperLat, lon: helperLon },
      });
      setAcceptedId(req.id);
      setTooFarWarning(false);
      showToast('Accepted — open I Can Help for the full trip screen.');
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? '');
      if (msg.includes('HELPER_SLOT_FULL')) {
        showToast('Another responder already accepted this SOS.');
      } else {
        showToast('Failed to accept. Please try again.');
      }
    }
  };

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    return min < 1 ? 'just now' : `${min} min ago`;
  };

  if (!user) return null;

  return (
    <View style={styles.page}>
      {/* Toast */}
      {toast && (
        <View style={styles.toastBar}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <HandHeart size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>I Can Help</Text>
            <Text style={styles.headerSub}>Respond to nearby emergencies</Text>
          </View>
        </View>

        <View style={styles.locStatusRow}>
          <MapPin size={12} color={locStatus === 'ok' ? '#34d399' : 'rgba(255,255,255,0.25)'} />
          <Text style={[styles.locStatusText, { color: locStatus === 'ok' ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.25)' }]}>
            {locStatus === 'ok'
              ? `Your location: ${helperLat?.toFixed(4)}, ${helperLon?.toFixed(4)} — showing SOS within 5 km`
              : 'Getting your location…'}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setTab('need-help')} style={[styles.tabBtn, tab === 'need-help' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === 'need-help' && styles.tabTextActive]}>🆘 Need Help</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('leaderboard')} style={[styles.tabBtn, tab === 'leaderboard' && styles.tabBtnActive]}>
            <Trophy size={14} color={tab === 'leaderboard' ? '#ffffff' : 'rgba(255,255,255,0.35)'} />
            <Text style={[styles.tabText, tab === 'leaderboard' && styles.tabTextActive]}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {tab === 'need-help' && (
          <>
            <View style={styles.feedHeader}>
              <Text style={styles.feedCount}>{visibleFeed.length} active request{visibleFeed.length !== 1 ? 's' : ''} nearby</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            {tooFarWarning && (
              <View style={styles.warningCard}>
                <AlertTriangle size={16} color="#fbbf24" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>📍 Location changed — you're too far</Text>
                  <Text style={styles.warningDesc}>The victim's location was updated and you are now more than 5 km away.</Text>
                </View>
              </View>
            )}

            {visibleFeed.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32 }}>✅</Text>
                <Text style={styles.emptyTitle}>No emergencies nearby</Text>
                <Text style={styles.emptyDesc}>No active SOS requests within 5 km. You'll be notified automatically.</Text>
              </View>
            )}

            {visibleFeed.map((req) => {
              const urgency = URGENCY_COLORS[req.severity as keyof typeof URGENCY_COLORS] ?? URGENCY_COLORS.low;
              const isAccepted = acceptedId === req.id;
              const distKm = (helperLat !== null && helperLon !== null && req.location)
                ? haversineKm(helperLat, helperLon, req.location.lat, req.location.lon).toFixed(1)
                : null;

              return (
                <View key={req.id} style={[styles.sosCard, { borderColor: urgency.border, backgroundColor: urgency.bg }]}>
                  <View style={styles.sosTop}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.sosTitle}>Emergency nearby</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.sosStat}>📍 {distKm !== null ? `${distKm} km away` : 'Distance unknown'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="rgba(255,255,255,0.4)" />
                          <Text style={styles.sosStat}>{timeAgo((req as any).createdAt ?? Date.now())}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.urgencyBadge, { borderColor: urgency.border }]}>
                      <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label} Urgency</Text>
                    </View>
                  </View>

                  {req.location && (
                    <View style={styles.coordRow}>
                      <MapPin size={12} color="rgba(255,255,255,0.2)" />
                      <Text style={styles.coordText}>{req.location.lat.toFixed(4)}, {req.location.lon.toFixed(4)}</Text>
                      <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${req.location!.lat},${req.location!.lon}`)}>
                        <Text style={styles.openMapLink}>Open map</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isAccepted ? (
                    <View style={styles.acceptedCard}>
                      <CheckCircle2 size={16} color="#34d399" />
                      <Text style={styles.acceptedText}>You accepted — head to the location</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleHelpNow(req)} activeOpacity={0.85} style={styles.helpBtn}>
                      <Text style={styles.helpBtnText}>🤝 Help Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {tab === 'leaderboard' && (
          <>
            <Text style={styles.lbHeader}>Community Heroes</Text>
            {LEADERBOARD_DEMO.map((entry, i) => (
              <View key={entry.rank} style={[styles.lbRow, i === 0 && styles.lbGold, i === 1 && styles.lbSilver, i === 2 && styles.lbBronze]}>
                <View style={[styles.lbAvatar, i === 0 && { backgroundColor: '#f59e0b' }, i === 1 && { backgroundColor: '#94a3b8' }, i === 2 && { backgroundColor: '#b45309' }]}>
                  <Text style={styles.lbAvatarText}>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : String(entry.rank)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbName}>{entry.name}</Text>
                  <Text style={styles.lbHelped}>{entry.helped} people helped</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.lbPoints}>{entry.points.toLocaleString()}</Text>
                  <Text style={styles.lbPtsLabel}>points</Text>
                </View>
              </View>
            ))}
            <View style={styles.lbFooter}>
              <Text style={styles.lbFooterText}>Rewards are shown after you help someone</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0b0f' },
  toastBar: { position: 'absolute', top: 16, left: '10%', right: '10%', zIndex: 50, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1a1b22', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  toastText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  header: { paddingTop: 32, paddingBottom: 16, paddingHorizontal: 20 },
  backText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  locStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  locStatusText: { fontSize: 10 },
  tabBar: { flexDirection: 'row', marginTop: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#13141a', padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  tabBtnActive: { backgroundColor: '#3b82f6', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
  tabText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.35)' },
  tabTextActive: { color: '#ffffff' },
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedCount: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
  liveText: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)', padding: 16 },
  warningTitle: { fontSize: 12, fontWeight: '900', color: '#fcd34d' },
  warningDesc: { fontSize: 10, color: 'rgba(252,211,77,0.6)', marginTop: 4, lineHeight: 16 },
  emptyState: { marginTop: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: 220, lineHeight: 16 },
  sosCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  sosTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sosTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  sosStat: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  urgencyBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  urgencyText: { fontSize: 10, fontWeight: '900' },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coordText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', flex: 1 },
  openMapLink: { fontSize: 10, color: 'rgba(96,165,250,0.6)', textDecorationLine: 'underline' },
  acceptedCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.1)', padding: 10 },
  acceptedText: { fontSize: 12, fontWeight: '600', color: '#6ee7b7' },
  helpBtn: { height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
  helpBtnText: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  lbHeader: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16 },
  lbGold: { borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)' },
  lbSilver: { borderColor: 'rgba(148,163,184,0.2)', backgroundColor: 'rgba(148,163,184,0.05)' },
  lbBronze: { borderColor: 'rgba(180,83,9,0.2)', backgroundColor: 'rgba(180,83,9,0.05)' },
  lbAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  lbAvatarText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  lbName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  lbHelped: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  lbPoints: { fontSize: 14, fontWeight: '900', color: '#93c5fd' },
  lbPtsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  lbFooter: { marginTop: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, alignItems: 'center' },
  lbFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
