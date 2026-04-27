import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CalendarCheck2, ChevronLeft, Clock, MapPin, Stethoscope, X, ChevronRight, Plus } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenAppointments, removeAppointment, type Appointment } from '../../data/appointments';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  completed: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

export const AppointmentsPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    return listenAppointments(user.uid, setAppointments);
  }, [user]);

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => removeAppointment(id) },
    ]);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>APPOINTMENTS</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Visits</Text>
          </View>
          <TouchableOpacity onPress={() => nav.navigate('Care')} style={styles.newBtn} activeOpacity={0.7}>
            <Plus size={16} color="#06b6d4" />
          </TouchableOpacity>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarCheck2 size={32} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyDesc}>Book a doctor visit from Hospital & Care.</Text>
            <TouchableOpacity onPress={() => nav.navigate('Care')} style={styles.bookBtn} activeOpacity={0.85}>
              <Stethoscope size={14} color="#ffffff" />
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {appointments.map((a, i) => {
              const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.scheduled;
              return (
                <Animated.View key={a.id} entering={FadeInDown.duration(400).delay(i * 60)}>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{a.status.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.date}>{formatDate(a.startAt)}</Text>
                    </View>
                    <Text style={styles.doctorName}>{a.doctorName}</Text>
                    <View style={styles.detailRow}>
                      <MapPin size={12} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.detailText}>{a.hospitalName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={12} color="rgba(255,255,255,0.35)" />
                      <Text style={styles.detailText}>{a.slot}</Text>
                    </View>
                    {a.fee > 0 && (
                      <Text style={styles.fee}>₹{a.fee}</Text>
                    )}
                    {a.status === 'scheduled' && (
                      <TouchableOpacity onPress={() => handleCancel(a.id)} style={styles.cancelBtn} activeOpacity={0.7}>
                        <X size={12} color="#ef4444" />
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#06b6d4', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  newBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(6,182,212,0.1)', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', backgroundColor: '#13141a', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#06b6d4', marginTop: 8 },
  bookBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  list: { gap: 8 },
  card: { backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  doctorName: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  fee: { fontSize: 14, fontWeight: '900', color: '#10b981' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)', marginTop: 4 },
  cancelText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
});
