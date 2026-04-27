import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { User, Heart, Shield, Phone, Mail, Droplets, MapPin, ChevronRight, LogOut, Settings, Moon, Sun, Star, FolderHeart, CalendarCheck2, HardHat } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenUserProfile, type UserProfile } from '../../data/user';
import { tierProgress } from '../../data/rewards';
import { logout } from '../../auth/authActions';

export const ProfilePage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { theme, toggle, colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    return listenUserProfile(user.uid, setProfile);
  }, [user]);

  const points = profile?.points ?? 0;
  const progress = tierProgress(points);
  const displayName = profile?.name || user?.displayName || 'User';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        nav.reset({ index: 0, routes: [{ name: 'Landing' }] });
      }},
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <User size={48} color="rgba(255,255,255,0.15)" />
        <Text style={styles.loginTitle}>Sign in to view your profile</Text>
        <TouchableOpacity onPress={() => nav.navigate('Login', {})} style={styles.loginBtn} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
            {profile?.phone && (
              <View style={styles.phoneRow}>
                <Phone size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.phoneText}>{profile.phone}</Text>
              </View>
            )}
            {user.email && (
              <View style={styles.phoneRow}>
                <Mail size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.phoneText}>{user.email}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Tier card */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.tierCard}>
            <Text style={styles.tierEmoji}>{progress.current.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierName}>{progress.current.name}</Text>
              <Text style={styles.tierTagline}>{progress.current.tagline}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Star size={12} color="#f59e0b" />
              <Text style={styles.pointsText}>{points}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Medical info */}
        {(profile?.bloodGroup || profile?.allergies) && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <View style={styles.medicalCard}>
              <View style={styles.medicalRow}>
                <Droplets size={14} color="#ef4444" />
                <Text style={styles.medicalLabel}>Blood Group</Text>
                <Text style={styles.medicalValue}>{profile?.bloodGroup || 'Not set'}</Text>
              </View>
              {profile?.allergies && (
                <View style={styles.medicalRow}>
                  <Shield size={14} color="#f59e0b" />
                  <Text style={styles.medicalLabel}>Allergies</Text>
                  <Text style={styles.medicalValue}>{profile.allergies}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Menu items */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.menuSection}>
          <Text style={styles.menuLabel}>ACCOUNT</Text>
          <MenuItem icon={Heart} label="Medical ID" color="#ef4444" onPress={() => nav.navigate('MedicalId')} />
          <MenuItem icon={FolderHeart} label="Health Vault" color="#ec4899" onPress={() => nav.navigate('Vault')} />
          <MenuItem icon={CalendarCheck2} label="Appointments" color="#06b6d4" onPress={() => nav.navigate('Appointments')} />
          <MenuItem icon={Shield} label="Safety Circle" color="#10b981" onPress={() => nav.navigate('SafetyCircle')} />
          <MenuItem icon={HardHat} label="Helmet & IoT" color="#8b5cf6" onPress={() => {}} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.menuSection}>
          <Text style={styles.menuLabel}>SETTINGS</Text>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              {theme === 'dark' ? <Moon size={16} color="#6366f1" /> : <Sun size={16} color="#6366f1" />}
            </View>
            <Text style={styles.menuItemText}>Dark Mode</Text>
            <Switch value={theme === 'dark'} onValueChange={toggle} trackColor={{ true: '#10b981', false: '#444' }} thumbColor="#ffffff" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(600)}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const MenuItem = ({ icon: Icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
      <Icon size={16} color={color} />
    </View>
    <Text style={styles.menuItemText}>{label}</Text>
    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)' },
  avatarText: { color: '#10b981', fontSize: 28, fontWeight: '900' },
  profileName: { fontSize: 22, fontWeight: '900', marginTop: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  phoneText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  tierCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  tierEmoji: { fontSize: 32 },
  tierName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  tierTagline: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  pointsText: { color: '#f59e0b', fontSize: 14, fontWeight: '900' },
  medicalCard: { backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12, gap: 10 },
  medicalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medicalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: 1 },
  medicalValue: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  menuSection: { marginBottom: 16 },
  menuLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 16, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#ffffff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '800' },
  loginTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '700', marginTop: 16 },
  loginBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  loginBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});
