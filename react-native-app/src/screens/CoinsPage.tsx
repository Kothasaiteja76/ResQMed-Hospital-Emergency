import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Award, TrendingUp, History, HeartPulse, Star } from 'lucide-react-native';
import { useAuth } from '../auth/AuthProvider';
import {
  listenUserPointsBalance,
  listenUserPointHistory,
  listenLeaderboard,
  type PointLedgerEntry,
  type UserPointsBalance,
} from '../data/points';

const POINT_TIERS = [
  { label: 'Rookie',    min: 0,    max: 299,  color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  icon: '🛡️' },
  { label: 'Protector', min: 300,  max: 699,  color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: '⚡' },
  { label: 'Guardian',  min: 700,  max: 1199, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: '🔥' },
  { label: 'Hero',      min: 1200, max: Infinity, color: '#fb7185', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', icon: '🏆' },
];

const getTier = (pts: number) => POINT_TIERS.find(t => pts >= t.min && pts < t.max) ?? POINT_TIERS[0]!;

const MEDALS = ['🥇', '🥈', '🥉'];

export const CoinsPage = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointLedgerEntry[]>([]);
  const [leaders, setLeaders] = useState<UserPointsBalance[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubBal = listenUserPointsBalance(user.uid, setBalance);
    const unsubHist = listenUserPointHistory(user.uid, setHistory);
    return () => { unsubBal(); unsubHist(); };
  }, [user?.uid]);

  useEffect(() => listenLeaderboard(setLeaders), []);

  const tier = getTier(balance);
  const nextTier = POINT_TIERS[POINT_TIERS.findIndex(t => t.label === tier.label) + 1];
  const pctToNext = nextTier ? Math.min(100, ((balance - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {/* Hero Balance Card */}
      <View style={[styles.card, { borderColor: tier.border }]}>
        <View style={[styles.badge, { borderColor: tier.border, backgroundColor: tier.bg }]}>
          <Star size={12} color={tier.color} />
          <Text style={[styles.badgeText, { color: tier.color }]}>Arogya Points</Text>
        </View>
        <Text style={styles.bigBalance}>{balance.toLocaleString()}</Text>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { borderColor: tier.border, backgroundColor: tier.bg }]}>
            <Text style={[styles.tagText, { color: tier.color }]}>{tier.icon} {tier.label}</Text>
          </View>
          <View style={[styles.tag, { borderColor: 'rgba(244,63,94,0.2)', backgroundColor: 'rgba(244,63,94,0.1)' }]}>
            <HeartPulse size={12} color="#fb7185" />
            <Text style={[styles.tagText, { color: '#fb7185' }]}> {Math.floor(balance / 50)} Rescues</Text>
          </View>
        </View>
        {nextTier && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress to {nextTier.label}</Text>
              <Text style={styles.progressLabel}>{nextTier.min - balance} pts to go</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pctToNext}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <History size={14} color="#34d399" />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No recent points activity yet</Text>
        ) : history.map((entry, i) => (
          <View key={entry.id || i} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.histReason}>{entry.reason}</Text>
              <Text style={styles.histDate}>
                {entry.timestamp?.toDate
                  ? entry.timestamp.toDate().toLocaleString()
                  : new Date(entry.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.histPoints}>+{entry.points}</Text>
          </View>
        ))}
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={14} color="#60a5fa" />
          <Text style={styles.sectionTitle}>Top Responders</Text>
        </View>
        {leaders.length === 0 ? (
          <Text style={styles.emptyText}>No data yet</Text>
        ) : leaders.map((leader, index) => {
          const lTier = getTier(leader.totalPoints);
          const isTop3 = index < 3;
          return (
            <View key={index} style={[styles.leaderRow, isTop3 && { borderColor: lTier.border, backgroundColor: lTier.bg }]}>
              <Text style={styles.rankText}>{isTop3 ? MEDALS[index] : `#${index + 1}`}</Text>
              <View style={[styles.avatar, { backgroundColor: lTier.bg }]}>
                <Text style={[styles.avatarLetter, { color: lTier.color }]}>{leader.userId.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderName} numberOfLines={1}>{leader.userId}</Text>
                <Text style={[styles.leaderTier, { color: lTier.color }]}>{lTier.icon} {lTier.label}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.leaderPts}>{leader.totalPoints.toLocaleString()}</Text>
                <Text style={styles.ptsLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* How to earn */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={14} color="#fbbf24" />
          <Text style={styles.sectionTitle}>How to earn</Text>
        </View>
        <View style={styles.earnGrid}>
          {[
            { action: 'Respond to SOS', pts: '+50 pts', color: '#fb7185' },
            { action: 'Navigate to victim', pts: '+3/step', color: '#60a5fa' },
            { action: 'First responder', pts: '+20 pts', color: '#34d399' },
            { action: 'Book appointment', pts: '+10 pts', color: '#fbbf24' },
          ].map((item) => (
            <View key={item.action} style={styles.earnCard}>
              <Text style={styles.earnAction}>{item.action}</Text>
              <Text style={[styles.earnPts, { color: item.color }]}>{item.pts}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0b0f' },
  pageContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48, gap: 16, alignItems: 'center' },
  card: { width: '100%', borderRadius: 24, borderWidth: 1, backgroundColor: '#13141a', padding: 24, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  bigBalance: { fontSize: 48, fontWeight: '900', color: '#ffffff', letterSpacing: -2 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '900' },
  progressSection: { marginTop: 24, width: '100%' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#f59e0b' },
  section: { width: '100%', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#13141a', padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 },
  emptyText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingVertical: 24 },
  historyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 4 },
  histReason: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  histDate: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  histPoints: { fontSize: 14, fontWeight: '900', color: '#34d399', marginLeft: 16 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  rankText: { width: 28, textAlign: 'center', fontSize: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 12, fontWeight: '900' },
  leaderName: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  leaderTier: { fontSize: 10, fontWeight: '700' },
  leaderPts: { fontSize: 14, fontWeight: '900', color: '#fbbf24' },
  ptsLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  earnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  earnCard: { width: '48%', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12 },
  earnAction: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  earnPts: { fontSize: 14, fontWeight: '900', marginTop: 4 },
});
