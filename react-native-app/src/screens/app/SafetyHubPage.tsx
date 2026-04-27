import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Shield, Users, Heart, HardHat, ChevronRight, Star, Trophy, MapPin, Siren, Phone, Brain, Activity } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenUserProfile, type UserProfile } from '../../data/user';
import { tierProgress, REWARD_TIERS } from '../../data/rewards';
import { listenHelmet, type HelmetDevice } from '../../data/helmet';

const { width } = Dimensions.get('window');

export const SafetyHubPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [helmet, setHelmet] = useState<HelmetDevice | null>(null);

  useEffect(() => {
    if (!user) return;
    const u1 = listenUserProfile(user.uid, setProfile);
    const u2 = listenHelmet(user.uid, setHelmet);
    return () => { u1(); u2(); };
  }, [user]);

  const points = profile?.points ?? 0;
  const progress = tierProgress(points);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.headerBadge}>
            <Shield size={14} color="#f59e0b" />
            <Text style={styles.headerBadgeText}>SAFETY HUB</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Your Safety Dashboard</Text>
        </Animated.View>

        {/* Rewards summary */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.rewardsCard}>
            <Text style={styles.rewardsEmoji}>{progress.current.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardsTitle}>{progress.current.name}</Text>
              <Text style={styles.rewardsTagline}>{progress.current.tagline}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Star size={12} color="#f59e0b" />
              <Text style={styles.pointsValue}>{points}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tier progress */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <View style={styles.tiersCard}>
            <Text style={styles.tiersLabel}>REWARD TIERS</Text>
            {REWARD_TIERS.map((tier, i) => {
              const isActive = tier.name === progress.current.name;
              const isReached = points >= tier.minPoints;
              return (
                <View key={tier.name} style={styles.tierRow}>
                  <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tierName, isActive && { color: '#f59e0b' }]}>{tier.name}</Text>
                    <Text style={styles.tierMin}>{tier.minPoints} pts</Text>
                  </View>
                  {isReached && <Star size={14} color="#f59e0b" />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <Text style={styles.sectionLabel}>SAFETY FEATURES</Text>
          <View style={styles.actionList}>
            <ActionCard icon={Heart} title="Medical ID" desc="Blood group, allergies, medications" color="#ef4444" onPress={() => nav.navigate('MedicalId')} />
            <ActionCard icon={Users} title="Safety Circle" desc="Emergency contacts" color="#06b6d4" onPress={() => nav.navigate('SafetyCircle')} />
            <ActionCard icon={HardHat} title="Smart Helmet" desc={helmet?.connected ? 'Connected' : 'Not paired'} color="#8b5cf6" onPress={() => {}} />
            <ActionCard icon={Siren} title="SOS History" desc="Past emergency alerts" color="#ef4444" onPress={() => {}} />
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const ActionCard = ({ icon: Icon, title, desc, color, onPress }: { icon: any; title: string; desc: string; color: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.actionCard}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Icon size={18} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </View>
    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBadgeText: { fontSize: 10, fontWeight: '900', color: '#f59e0b', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 4, marginBottom: 16 },
  rewardsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  rewardsEmoji: { fontSize: 36 },
  rewardsTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  rewardsTagline: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pointsValue: { color: '#f59e0b', fontSize: 16, fontWeight: '900' },
  tiersCard: { backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  tiersLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 10 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  tierEmoji: { fontSize: 20 },
  tierName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  tierMin: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 8 },
  actionList: { gap: 6 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  actionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
