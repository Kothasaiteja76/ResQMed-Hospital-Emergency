import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Siren, HandHeart, Stethoscope, CalendarCheck2, FolderHeart, Trophy,
  ShieldCheck, HardHat, MapPin, ChevronRight, Battery, Wifi, CheckCircle2,
  Activity, Bell, Zap,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenUserProfile, type UserProfile } from '../../data/user';
import { listenHelmet, type HelmetDevice } from '../../data/helmet';
import { tierProgress } from '../../data/rewards';
import { useSharedLocation } from '../../hooks/useSharedLocation';

const { width } = Dimensions.get('window');

export const DashboardPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { currentLocation, requestGPS } = useSharedLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [helmet, setHelmet] = useState<HelmetDevice | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub1 = listenUserProfile(user.uid, setProfile);
    const unsub2 = listenHelmet(user.uid, setHelmet);
    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
    requestGPS({ silent: true });
  }, [requestGPS]);

  const points = profile?.points ?? 0;
  const progress = tierProgress(points);
  const greeting = getGreeting();
  const displayName = profile?.name || user?.displayName || 'User';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting}</Text>
              <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => nav.navigate('Profile' as any)}
              style={[styles.avatar, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Location */}
        {currentLocation && (
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.locationBadge}>
            <MapPin size={12} color="#10b981" />
            <Text style={styles.locationText}>{currentLocation.displayName || 'GPS Located'}</Text>
          </Animated.View>
        )}

        {/* SOS Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <TouchableOpacity
            onPress={() => nav.navigate('SOS', {})}
            activeOpacity={0.85}
            style={styles.sosCard}
          >
            <View style={styles.sosGlow} />
            <View style={styles.sosInner}>
              <View style={styles.sosIcon}>
                <Siren size={28} color="#ffffff" />
              </View>
              <View style={styles.sosContent}>
                <Text style={styles.sosLabel}>EMERGENCY SOS</Text>
                <Text style={styles.sosTitle}>Need help now?</Text>
                <Text style={styles.sosDesc}>Tap to trigger SOS — nearby helpers will be alerted instantly.</Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.quickGrid}>
          <QuickCard icon={HandHeart} title="I Can Help" desc="Respond to SOS" color="#10b981" onPress={() => nav.navigate('Help')} />
          <QuickCard icon={Stethoscope} title="Hospital" desc="Book a doctor" color="#3b82f6" onPress={() => nav.navigate('Care')} />
          <QuickCard icon={CalendarCheck2} title="Appointments" desc="Your visits" color="#06b6d4" onPress={() => nav.navigate('Appointments')} />
          <QuickCard icon={FolderHeart} title="Health Vault" desc="Records & scans" color="#ec4899" onPress={() => nav.navigate('Vault')} />
        </Animated.View>

        {/* Helmet Status */}
        {helmet && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <View style={styles.helmetCard}>
              <View style={styles.helmetGlow} />
              <View style={styles.helmetHeader}>
                <HardHat size={20} color="#8b5cf6" />
                <Text style={styles.helmetTitle}>Helmet One</Text>
                <View style={[styles.statusDot, { backgroundColor: helmet.connected ? '#10b981' : '#ef4444' }]} />
                <Text style={styles.helmetStatus}>{helmet.connected ? 'Connected' : 'Offline'}</Text>
              </View>
              <View style={styles.helmetStats}>
                <HelmetStat icon={Battery} label="Battery" value={`${helmet.batteryPct}%`} color={helmet.batteryPct > 20 ? '#10b981' : '#ef4444'} />
                <HelmetStat icon={Wifi} label="Sensors" value={helmet.sensorsActive ? 'Active' : 'Off'} color={helmet.sensorsActive ? '#10b981' : '#f59e0b'} />
                <HelmetStat icon={CheckCircle2} label="Verified" value={helmet.verifiedAt ? formatAgo(helmet.verifiedAt) : 'Never'} color="#3b82f6" />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Rewards Tier */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <Text style={styles.rewardsEmoji}>{progress.current.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardsTier}>{progress.current.name}</Text>
                <Text style={styles.rewardsTagline}>{progress.current.tagline}</Text>
              </View>
              <Text style={styles.rewardsPoints}>{points} pts</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress.pct}%` }]} />
            </View>
            {progress.next && (
              <Text style={styles.rewardsRemaining}>
                {progress.remaining} pts to {progress.next.name}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Safety section */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)}>
          <Text style={styles.sectionTitle}>Safety & Records</Text>
          <View style={styles.listCards}>
            <ListCard icon={ShieldCheck} title="Medical ID" desc="Blood group, allergies, meds" color="#ef4444" onPress={() => nav.navigate('MedicalId')} />
            <ListCard icon={Trophy} title="Safety Circle" desc="Emergency contacts" color="#06b6d4" onPress={() => nav.navigate('SafetyCircle')} />
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const QuickCard = ({ icon: Icon, title, desc, color, onPress }: { icon: any; title: string; desc: string; color: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.quickCard}>
    <View style={[styles.quickIcon, { backgroundColor: color + '20' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={styles.quickTitle}>{title}</Text>
    <Text style={styles.quickDesc}>{desc}</Text>
  </TouchableOpacity>
);

const ListCard = ({ icon: Icon, title, desc, color, onPress }: { icon: any; title: string; desc: string; color: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.listCard}>
    <View style={[styles.listIcon, { backgroundColor: color + '20' }]}>
      <Icon size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.listTitle}>{title}</Text>
      <Text style={styles.listDesc}>{desc}</Text>
    </View>
    <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
  </TouchableOpacity>
);

const HelmetStat = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <View style={styles.helmetStatItem}>
    <Icon size={14} color={color} />
    <Text style={styles.helmetStatLabel}>{label}</Text>
    <Text style={[styles.helmetStatValue, { color }]}>{value}</Text>
  </View>
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '900', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  locationText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  sosCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
  sosGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#dc2626', opacity: 0.15 },
  sosInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)' },
  sosIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  sosContent: { flex: 1 },
  sosLabel: { fontSize: 9, fontWeight: '900', color: '#ef4444', letterSpacing: 2 },
  sosTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  sosDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickCard: { width: (width - 48) / 2, backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  quickIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  quickDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  helmetCard: { backgroundColor: '#13141a', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16, overflow: 'hidden' },
  helmetGlow: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(139,92,246,0.15)' },
  helmetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helmetTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff', flex: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  helmetStatus: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  helmetStats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  helmetStatItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  helmetStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '700', textTransform: 'uppercase' },
  helmetStatValue: { fontSize: 12, fontWeight: '800' },
  rewardsCard: { backgroundColor: '#13141a', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  rewardsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rewardsEmoji: { fontSize: 28 },
  rewardsTier: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  rewardsTagline: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  rewardsPoints: { fontSize: 14, fontWeight: '900', color: '#f59e0b' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#f59e0b' },
  rewardsRemaining: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'right' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  listCards: { gap: 6 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  listIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  listDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
