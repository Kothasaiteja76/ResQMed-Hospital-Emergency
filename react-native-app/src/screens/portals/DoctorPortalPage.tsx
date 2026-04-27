import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Stethoscope, CalendarCheck2, Users, FileText } from 'lucide-react-native';
import { useTheme } from '../../app/ThemeContext';

export const DoctorPortalPage = () => {
  const nav = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>DOCTOR PORTAL</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Dashboard</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <PortalCard icon={CalendarCheck2} title="Appointments" desc="View scheduled visits" color="#06b6d4" />
          <PortalCard icon={Users} title="Patients" desc="Manage patients" color="#10b981" />
          <PortalCard icon={FileText} title="Records" desc="Medical records" color="#ec4899" />
          <PortalCard icon={Stethoscope} title="Profile" desc="Your doctor profile" color="#8b5cf6" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const PortalCard = ({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) => (
  <View style={styles.card}>
    <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  cardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
