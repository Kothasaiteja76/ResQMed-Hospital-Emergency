import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Building2, MapPin, Phone, Clock, Star, ChevronRight } from 'lucide-react-native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useTheme } from '../../../app/ThemeContext';
import { SHOWCASE_HOSPITAL, DEPARTMENTS } from '../../../data/hospitals';

export const CareHospitalPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { colors } = useTheme();
  const hospitalId = (route.params as any)?.hospitalId as string;
  const filterDept = (route.params as any)?.dept as string | undefined;
  const hospital = SHOWCASE_HOSPITAL;

  const availableDepts = [...new Set(hospital.doctors.map((d) => d.department))];
  const depts = filterDept ? [filterDept] : availableDepts;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>HOSPITAL</Text>
            <Text style={[styles.title, { color: colors.text }]}>{hospital.name}</Text>
          </View>
        </View>

        {/* Hospital info */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.infoCard}>
            <Building2 size={20} color="#3b82f6" />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.infoRow}>
                <MapPin size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.infoText}>{hospital.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Phone size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.infoText}>{hospital.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Clock size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.infoText}>{hospital.hours}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Departments */}
        <Text style={styles.sectionLabel}>DEPARTMENTS</Text>
        {depts.map((deptId) => {
          const dept = DEPARTMENTS.find((d) => d.id === deptId);
          const doctors = hospital.doctors.filter((d) => d.department === deptId);
          if (!dept) return null;

          return (
            <Animated.View key={deptId} entering={FadeInDown.duration(400).delay(200)}>
              <Text style={styles.deptTitle}>{dept.emoji} {dept.name}</Text>
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => nav.navigate('CareBook', { hospitalId: hospital.id, doctorId: doc.id, departmentId: deptId })}
                  activeOpacity={0.7}
                  style={styles.doctorCard}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{doc.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <Text style={styles.doctorSpec}>{doc.specialty}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={10} color="#f59e0b" />
                      <Text style={styles.rating}>{doc.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.fee}>₹{doc.fee}</Text>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </Animated.View>
          );
        })}

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
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  infoCard: { flexDirection: 'row', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 8 },
  deptTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff', marginBottom: 8, marginTop: 8 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 6 },
  doctorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  doctorInitial: { color: '#3b82f6', fontSize: 16, fontWeight: '900' },
  doctorName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  doctorSpec: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  rating: { fontSize: 10, color: '#f59e0b', fontWeight: '700' },
  fee: { color: '#10b981', fontSize: 14, fontWeight: '900' },
});
