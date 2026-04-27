import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Siren, HandHeart, Stethoscope, CalendarCheck2, FolderHeart, Trophy, ShieldCheck,
  Sparkles, MapPin, ChevronRight, Clock, Heart, Phone, Smartphone,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../app/ThemeContext';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: Siren, title: 'One-Tap SOS', desc: 'Instant emergency alert with live GPS to nearby helpers', gradient: ['#ef4444', '#dc2626'] },
  { icon: HandHeart, title: 'Community Rescue', desc: 'Accept SOS alerts near you and earn reward points', gradient: ['#10b981', '#059669'] },
  { icon: Stethoscope, title: 'Hospital & Doctor', desc: 'Book appointments, find specialists, pay with GPay', gradient: ['#3b82f6', '#2563eb'] },
  { icon: CalendarCheck2, title: 'Smart Appointments', desc: 'Manage visits, set reminders, view history', gradient: ['#06b6d4', '#0891b2'] },
  { icon: FolderHeart, title: 'Health Vault', desc: 'Prescriptions, lab reports & scans — encrypted', gradient: ['#ec4899', '#db2777'] },
  { icon: Trophy, title: 'Reward Tiers', desc: 'From Newcomer to Platinum — earn by helping', gradient: ['#f59e0b', '#d97706'] },
  { icon: ShieldCheck, title: 'Medical ID', desc: 'Blood group, allergies & meds visible to responders', gradient: ['#8b5cf6', '#7c3aed'] },
  { icon: Sparkles, title: 'Smart Helmet', desc: 'IoT crash detection → auto SOS with GPS & g-force', gradient: ['#6366f1', '#4f46e5'] },
];

export const LandingPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0b0f" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.hero}>
          <View style={styles.badge}>
            <MapPin size={12} color="#10b981" />
            <Text style={styles.badgeText}>India's Emergency Network</Text>
          </View>
          <Text style={styles.heroTitle}>Arogya{'\n'}Raksha</Text>
          <Text style={styles.heroSubtitle}>
            One-tap SOS. Community rescue. Hospital care.{'\n'}
            All in one app — built to save lives.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              onPress={() => nav.navigate('MainTabs')}
              activeOpacity={0.85}
              style={styles.primaryButton}
            >
              <Siren size={18} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Open App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => nav.navigate('Login', {})}
              activeOpacity={0.7}
              style={styles.secondaryButton}
            >
              <Phone size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem value="< 30s" label="SOS trigger" />
            <StatItem value="5 km" label="help radius" />
            <StatItem value="24×7" label="always on" />
          </View>
        </Animated.View>

        {/* Features grid */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <Text style={styles.sectionTitle}>Everything you need in an emergency</Text>

          <View style={styles.grid}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Animated.View
                  key={f.title}
                  entering={FadeInUp.duration(400).delay(100 + i * 55)}
                  style={styles.featureCard}
                >
                  <View style={[styles.featureIcon, { backgroundColor: f.gradient[0] + '20' }]}>
                    <Icon size={20} color={f.gradient[0]} />
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* How it works */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.section}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <Text style={styles.sectionTitle}>Three steps to safety</Text>

          {[
            { step: '1', title: 'Trigger SOS', desc: 'Tap the big red button or let your smart helmet auto-detect a crash.', color: '#ef4444' },
            { step: '2', title: 'Helpers alerted', desc: 'Nearby users within 5 km receive a live SOS alert with your GPS.', color: '#f59e0b' },
            { step: '3', title: 'Hospital notified', desc: 'Helper picks the nearest hospital and rides with you. ER is prepped.', color: '#10b981' },
          ].map((s) => (
            <View key={s.step} style={styles.stepCard}>
              <View style={[styles.stepBadge, { backgroundColor: s.color }]}>
                <Text style={styles.stepNumber}>{s.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => nav.navigate('Signup', {})}
            activeOpacity={0.85}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <ChevronRight size={18} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>Free · No credit card · Works across India</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  scroll: { paddingHorizontal: 16 },
  hero: { paddingTop: 60, paddingBottom: 32 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
  },
  badgeText: { color: '#10b981', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { fontSize: 44, fontWeight: '900', color: '#ffffff', marginTop: 20, lineHeight: 50 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 12, lineHeight: 22 },
  heroButtons: { flexDirection: 'row', gap: 12, marginTop: 28 },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 28,
    borderRadius: 26, backgroundColor: '#ef4444',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 24,
    borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 28 },
  statItem: { alignItems: 'center', flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 12 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginTop: 40 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureCard: {
    width: (width - 48) / 2, backgroundColor: '#13141a', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  featureIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  featureDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 16 },
  stepCard: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  stepBadge: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  stepDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 18 },
  ctaSection: { marginTop: 40, alignItems: 'center' },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 56, paddingHorizontal: 36,
    borderRadius: 28, backgroundColor: '#10b981',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  ctaButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  ctaSubtext: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 },
});
