import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Building2, Star } from 'lucide-react-native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useTheme } from '../../../app/ThemeContext';
import { SHOWCASE_HOSPITAL, DEPARTMENTS } from '../../../data/hospitals';

export const CareDepartmentPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { colors } = useTheme();
  const departmentId = (route.params as any)?.departmentId as string;

  const dept = DEPARTMENTS.find((d) => d.id === departmentId);
  const doctors = SHOWCASE_HOSPITAL.doctors.filter((d) => d.department === departmentId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>{dept?.emoji} {dept?.name?.toUpperCase()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Doctors</Text>
          </View>
        </View>

        {/* Hospital card */}
        <TouchableOpacity
          onPress={() => nav.navigate('CareHospital', { hospitalId: SHOWCASE_HOSPITAL.id, dept: departmentId })}
          activeOpacity={0.7}
          style={styles.hospitalCard}
        >
          <Building2 size={18} color="#3b82f6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalName}>{SHOWCASE_HOSPITAL.name}</Text>
            <Text style={styles.hospitalAddr}>{SHOWCASE_HOSPITAL.address}</Text>
          </View>
          <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>

        {/* Doctors list */}
        {doctors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No doctors found in this department.</Text>
          </View>
        ) : (
          <View style={styles.doctorList}>
            {doctors.map((doc, i) => (
              <Animated.View key={doc.id} entering={FadeInDown.duration(400).delay(i * 60)}>
                <TouchableOpacity
                  onPress={() => nav.navigate('CareBook', { hospitalId: SHOWCASE_HOSPITAL.id, doctorId: doc.id, departmentId })}
                  activeOpacity={0.7}
                  style={styles.doctorCard}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{doc.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                    <View style={styles.doctorMeta}>
                      <Star size={10} color="#f59e0b" />
                      <Text style={styles.doctorRating}>{doc.rating}</Text>
                      <Text style={styles.doctorExp}>{doc.experience}</Text>
                    </View>
                  </View>
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeText}>₹{doc.fee}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
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
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  hospitalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', marginBottom: 16 },
  hospitalName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  hospitalAddr: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  doctorList: { gap: 6 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  doctorInitial: { color: '#3b82f6', fontSize: 18, fontWeight: '900' },
  doctorName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  doctorSpecialty: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  doctorMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  doctorRating: { fontSize: 11, color: '#f59e0b', fontWeight: '700' },
  doctorExp: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 6 },
  feeBadge: { backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  feeText: { color: '#10b981', fontSize: 14, fontWeight: '900' },
});
