import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Calendar, Clock, CreditCard, Star, CheckCircle2, Stethoscope } from 'lucide-react-native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useAuth } from '../../../auth/AuthProvider';
import { useTheme } from '../../../app/ThemeContext';
import { SHOWCASE_HOSPITAL, DEPARTMENTS } from '../../../data/hospitals';
import { bookAppointment } from '../../../data/appointments';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

export const CareBookPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const { colors } = useTheme();

  const doctorId = (route.params as any)?.doctorId as string;
  const hospitalId = (route.params as any)?.hospitalId as string;
  const departmentId = (route.params as any)?.departmentId as string;

  const doctor = SHOWCASE_HOSPITAL.doctors.find((d) => d.id === doctorId);
  const dept = DEPARTMENTS.find((d) => d.id === departmentId);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gpay'>('cash');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBook = async () => {
    if (!user) {
      nav.navigate('Login', { redirect: 'Care' });
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Select a slot', 'Please choose a time slot for your appointment.');
      return;
    }
    setBusy(true);

    try {
      const startAt = new Date();
      startAt.setHours(parseInt(selectedSlot.split(':')[0]!));
      startAt.setMinutes(parseInt(selectedSlot.split(':')[1]!));

      await bookAppointment({
        userId: user.uid,
        doctorId: doctor?.id ?? doctorId,
        doctorName: doctor?.name ?? 'Doctor',
        departmentId,
        hospitalId: SHOWCASE_HOSPITAL.id,
        hospitalName: SHOWCASE_HOSPITAL.name,
        startAt,
        slot: selectedSlot,
        fee: doctor?.fee ?? 500,
        paymentMethod,
      });
      setSuccess(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Booking failed');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, styles.center]}>
        <CheckCircle2 size={56} color="#10b981" />
        <Text style={styles.successTitle}>Appointment Booked!</Text>
        <Text style={styles.successDesc}>
          {doctor?.name} · {selectedSlot}
        </Text>
        <TouchableOpacity
          onPress={() => nav.navigate('Appointments')}
          activeOpacity={0.85}
          style={styles.viewBtn}
        >
          <Text style={styles.viewBtnText}>View Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('MainTabs')} activeOpacity={0.7}>
          <Text style={styles.homeLink}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>BOOK APPOINTMENT</Text>
            <Text style={[styles.title, { color: colors.text }]}>Confirm Details</Text>
          </View>
        </View>

        {/* Doctor info */}
        {doctor && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <View style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Stethoscope size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialty}</Text>
                <View style={styles.ratingRow}>
                  <Star size={10} color="#f59e0b" />
                  <Text style={styles.ratingText}>{doctor.rating}</Text>
                  <Text style={styles.expText}>{doctor.experience}</Text>
                </View>
              </View>
              <Text style={styles.fee}>₹{doctor.fee}</Text>
            </View>
          </Animated.View>
        )}

        {/* Time slots */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.fieldLabel}>SELECT TIME SLOT</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.7}
                style={[styles.slotChip, selectedSlot === slot && styles.slotActive]}
              >
                <Clock size={12} color={selectedSlot === slot ? '#3b82f6' : 'rgba(255,255,255,0.3)'} />
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Payment method */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity onPress={() => setPaymentMethod('cash')} activeOpacity={0.7} style={[styles.payOption, paymentMethod === 'cash' && styles.payActive]}>
              <CreditCard size={16} color={paymentMethod === 'cash' ? '#10b981' : 'rgba(255,255,255,0.4)'} />
              <Text style={[styles.payText, paymentMethod === 'cash' && { color: '#10b981' }]}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaymentMethod('gpay')} activeOpacity={0.7} style={[styles.payOption, paymentMethod === 'gpay' && styles.payActive]}>
              <Text style={[styles.payText, paymentMethod === 'gpay' && { color: '#10b981' }]}>Google Pay</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Book button */}
        <TouchableOpacity
          onPress={handleBook}
          disabled={busy || !selectedSlot}
          activeOpacity={0.85}
          style={[styles.bookBtn, (busy || !selectedSlot) && { opacity: 0.5 }]}
        >
          <Text style={styles.bookBtnText}>{busy ? 'Booking…' : `Book · ₹${doctor?.fee ?? 500}`}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  doctorName: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  doctorSpec: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 11, color: '#f59e0b', fontWeight: '700' },
  expText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 6 },
  fee: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  slotActive: { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' },
  slotText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  slotTextActive: { color: '#3b82f6' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  payActive: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' },
  payText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  bookBtn: { height: 52, borderRadius: 26, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  bookBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', marginTop: 20 },
  successDesc: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
  viewBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  viewBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  homeLink: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16, textDecorationLine: 'underline' },
});
