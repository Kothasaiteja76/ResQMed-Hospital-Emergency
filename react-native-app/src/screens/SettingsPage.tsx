import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Settings, LogOut, User, Shield, Droplets, Activity, ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { logout } from '../auth/authActions';
import { useAuth } from '../auth/AuthProvider';
import { detectCrash, type SensorSample } from '../features/sos/crashDetection';

export const SettingsPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const [sample, setSample] = useState<SensorSample>({
    lat: 28.6139, lon: 77.209, speedKmh: 42, accelerationG: 0.4, orientation: 'normal', vibration: 10,
  });
  const prevRef = useRef<SensorSample | null>(null);
  const detection = useMemo(() => detectCrash(prevRef.current, sample), [sample]);
  const setPrev = () => { prevRef.current = sample; };

  const handleLogout = async () => {
    setBusy(true);
    try { await logout(); nav.reset({ index: 0, routes: [{ name: 'Landing' }] }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Settings size={14} color="rgba(255,255,255,0.3)" />
          <Text style={styles.headerLabel}>Preferences</Text>
        </View>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your emergency profile</Text>

        <View style={{ marginTop: 20, gap: 8 }}>
          <SettingItem icon={<User size={16} color="rgba(255,255,255,0.5)" />} title="Profile Details" subtitle={user?.displayName || 'Guest User'} />
          <SettingItem icon={<Shield size={16} color="rgba(255,255,255,0.5)" />} title="Emergency Contacts" subtitle="0 configured" alert />
          <SettingItem icon={<Droplets size={16} color="#f87171" />} title="Blood Group & Allergies" subtitle="Not set" alert />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={handleLogout} disabled={busy || !user} activeOpacity={0.7} style={[styles.logoutBtn, (busy || !user) && { opacity: 0.5 }]}>
            {busy ? <ActivityIndicator size="small" color="#f87171" /> : (
              <>
                <LogOut size={16} color="#f87171" />
                <Text style={styles.logoutText}>Log out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Crash Detection Monitor */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Activity size={14} color="rgba(255,255,255,0.3)" />
          <Text style={styles.headerLabel}>Diagnostics</Text>
        </View>
        <Text style={[styles.title, { fontSize: 20 }]}>Crash Detection Monitor</Text>
        <Text style={styles.subtitle}>Adjust sliders to simulate sensor readings</Text>

        <View style={[styles.badge, { marginTop: 16 }]}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>Sensors Active</Text>
        </View>

        {/* AI Confidence */}
        <View style={styles.aiCard}>
          <View style={styles.aiRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={14} color="rgba(255,255,255,0.3)" />
              <Text style={styles.aiLabel}>AI Crash Confidence</Text>
            </View>
            <Text style={[styles.aiValue, { color: detection.crashed ? '#f87171' : '#34d399' }]}>
              {detection.crashed ? '84%' : '0%'}
            </Text>
          </View>
          <View style={styles.aiBar}>
            <View style={[styles.aiFill, { width: detection.crashed ? '84%' : '1%', backgroundColor: detection.crashed ? '#ef4444' : '#34d399' }]} />
          </View>
          {detection.crashed && (
            <Text style={styles.aiWarning}>⚠ Crash indicators: {detection.reasons.join(', ')}</Text>
          )}
        </View>

        {/* Sliders */}
        <View style={{ marginTop: 12, gap: 12 }}>
          <SensorSlider
            label="Speed" icon="speed" unit="km/h" min={0} max={120} value={sample.speedKmh}
            onChange={(v) => { setPrev(); setSample((s) => ({ ...s, speedKmh: v })); }}
          />
          <SensorSlider
            label="G-Force / Impact" icon="force" unit="G" min={0} max={4} step={0.1} value={sample.accelerationG}
            onChange={(v) => { setPrev(); setSample((s) => ({ ...s, accelerationG: v })); }}
          />
          <SensorSlider
            label="Tilt Angle" icon="tilt" unit="°" min={0} max={180}
            value={sample.orientation === 'flipped' ? 180 : sample.vibration}
            onChange={(v) => { setPrev(); setSample((s) => ({ ...s, vibration: v, orientation: v > 90 ? 'flipped' : 'normal' })); }}
          />
        </View>
      </View>

      <Text style={styles.version}>Arogya Raksha v1.0 • Demo mode</Text>
    </ScrollView>
  );
};

const SettingItem = ({ icon, title, subtitle, alert }: { icon: React.ReactNode; title: string; subtitle: string; alert?: boolean }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={[styles.settingSub, alert && { color: '#f87171' }]}>{subtitle}</Text>
    </View>
  </View>
);

const SensorSlider = ({ label, icon, value, min, max, step, unit, onChange }: {
  label: string; icon: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void;
}) => {
  const iconColors: Record<string, string> = { speed: '#3b82f6', force: '#f59e0b', tilt: '#a855f7' };
  const c = iconColors[icon] || '#ffffff';
  return (
    <View style={styles.sliderCard}>
      <View style={styles.sliderHeader}>
        <View style={[styles.sliderIcon, { backgroundColor: `${c}18` }]}>
          <Text style={{ color: c, fontSize: 10, fontWeight: '900' }}>{icon === 'speed' ? '▲' : icon === 'force' ? '⚡' : '↗'}</Text>
        </View>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value.toFixed(step && step < 1 ? 1 : 0)} <Text style={styles.sliderUnit}>{unit}</Text>
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step ?? 1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="rgba(255,255,255,0.15)"
        maximumTrackTintColor="rgba(255,255,255,0.05)"
        thumbTintColor="#ef4444"
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0b0f' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 16 },
  card: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#34d399' },
  aiCard: { marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16 },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aiLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  aiValue: { fontSize: 18, fontWeight: '900' },
  aiBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  aiFill: { height: '100%', borderRadius: 3 },
  aiWarning: { fontSize: 10, color: '#fca5a5', marginTop: 8 },
  logoutSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  logoutBtn: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 12, fontWeight: '900', color: '#f87171' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16 },
  settingIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  settingSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  sliderCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16 },
  sliderHeader: { flexDirection: 'row', alignItems: 'center' },
  sliderIcon: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sliderLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  sliderValue: { fontSize: 16, fontWeight: '900', color: '#34d399' },
  sliderUnit: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  version: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)' },
});
