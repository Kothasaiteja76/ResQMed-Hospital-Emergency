import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ChevronLeft, Star, MapPin, Clock, Search, Stethoscope, Building2, Sparkles, ChevronRight, Phone } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  DEPARTMENTS, SHOWCASE_HOSPITAL, SHOWCASE_HOSPITAL_ID,
  findNearbyHospitals, getDepartment, getShowcaseDoctorsForDept,
  type DepartmentId, type Doctor, type HospitalInfo,
} from '../data/hospitals';
import { useSharedLocation } from '../hooks/useSharedLocation';

export const CareDoctorsPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CareHospital'>>();
  const hospitalId = route.params?.hospitalId || SHOWCASE_HOSPITAL_ID;
  const deptId = (route.params?.deptId || 'general') as DepartmentId;
  const [deptIdState, setDeptIdState] = useState<DepartmentId>(deptId);
  const dept = getDepartment(deptIdState);

  const [hospital, setHospital] = useState<HospitalInfo | null>(
    hospitalId === SHOWCASE_HOSPITAL_ID ? SHOWCASE_HOSPITAL : null
  );
  const { currentLocation } = useSharedLocation();

  useEffect(() => {
    if (hospital) return;
    if (!currentLocation) return;
    findNearbyHospitals({ lat: currentLocation.lat, lon: currentLocation.lon }).then((list) => {
      const match = list.find((h) => h.id === hospitalId);
      if (match) setHospital(match);
    }).catch(() => {});
  }, [hospital, currentLocation?.lat, currentLocation?.lon, hospitalId]);

  const isShowcase = hospitalId === SHOWCASE_HOSPITAL_ID;
  const doctors: Doctor[] = useMemo(
    () => isShowcase ? getShowcaseDoctorsForDept(deptIdState) : [],
    [isShowcase, deptIdState]
  );

  const [q, setQ] = useState('');
  const visibleDoctors = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return doctors;
    return doctors.filter((d) =>
      d.name.toLowerCase().includes(needle) ||
      d.title.toLowerCase().includes(needle) ||
      d.qualifications.toLowerCase().includes(needle)
    );
  }, [q, doctors]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backRow}>
        <ChevronLeft size={14} color="rgba(255,255,255,0.4)" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Hospital hero card */}
      <View style={styles.heroCard}>
        <View style={[styles.heroBanner, { backgroundColor: isShowcase ? '#0891b2' : '#1e293b' }]}>
          <View style={styles.heroBannerOverlay} />
          <View style={styles.heroBannerContent}>
            {isShowcase && (
              <View style={styles.partnerBadge}>
                <Sparkles size={10} color="#bbf7d0" />
                <Text style={styles.partnerBadgeText}>Partner</Text>
              </View>
            )}
            {typeof hospital?.rating === 'number' && (
              <View style={styles.ratingBadge}>
                <Star size={12} color="#fbbf24" />
                <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
              </View>
            )}
            <Text style={styles.heroName} numberOfLines={1}>{hospital?.name || 'Loading…'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPin size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroAddr} numberOfLines={1}>{hospital?.address || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <MiniStat icon={<Clock size={14} color="#34d399" />} label="Hours" value={hospital?.openingHours || '10 AM–10 PM'} />
          <MiniStat icon={<Stethoscope size={14} color="#38bdf8" />} label={isShowcase ? 'Doctors' : 'Departments'} value={isShowcase ? '12+' : 'Multi'} />
          <MiniStat icon={<Phone size={14} color="#fbbf24" />} label="Contact" value={isShowcase ? '24×7' : 'On-site'} />
        </View>
      </View>

      {/* Department chips */}
      <Text style={styles.sectionLabel}>Department</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {DEPARTMENTS.map((d) => (
          <TouchableOpacity key={d.id} onPress={() => setDeptIdState(d.id)} activeOpacity={0.7}
            style={[styles.deptChip, d.id === deptIdState && styles.deptChipActive]}>
            <Text style={{ fontSize: 14 }}>{d.icon}</Text>
            <Text style={[styles.deptChipText, d.id === deptIdState && styles.deptChipTextActive]}>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Doctor search */}
      {isShowcase && (
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.3)" />
          <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search doctor or condition" placeholderTextColor="rgba(255,255,255,0.25)" />
        </View>
      )}

      {/* Doctors list */}
      {isShowcase ? (
        <>
          <Text style={styles.doctorCount}>{visibleDoctors.length} doctor{visibleDoctors.length === 1 ? '' : 's'} in {dept.name}</Text>
          {visibleDoctors.map((d) => (
            <DoctorRow key={d.id} doctor={d} hospitalId={hospitalId} nav={nav} />
          ))}
          {visibleDoctors.length === 0 && (
            <View style={styles.emptyCard}>
              <Stethoscope size={28} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>No matching doctor</Text>
              <Text style={styles.emptyDesc}>Try another specialty or search term</Text>
            </View>
          )}
        </>
      ) : (
        <PartnerRedirectCard hospital={hospital} deptId={deptIdState} nav={nav} />
      )}
    </ScrollView>
  );
};

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.miniStat}>
    {icon}
    <Text style={styles.miniStatValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.miniStatLabel}>{label}</Text>
  </View>
);

const DoctorRow = ({ doctor, hospitalId, nav }: { doctor: Doctor; hospitalId: string; nav: any }) => (
  <TouchableOpacity activeOpacity={0.7} style={styles.doctorRow}
    onPress={() => nav.navigate('CareBook', { doctorId: doctor.id, hospitalId, deptId: doctor.department })}>
    <View style={[styles.doctorAvatar, { backgroundColor: `${doctor.avatarTint}20` }]}>
      <Text style={{ fontSize: 20 }}>{doctor.avatarEmoji}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.doctorName}>{doctor.name}</Text>
      <Text style={styles.doctorTitle}>{doctor.title}</Text>
      <Text style={styles.doctorQual}>{doctor.qualifications}</Text>
      <View style={styles.doctorMeta}>
        <Star size={12} color="#fbbf24" />
        <Text style={styles.doctorMetaText}>{doctor.rating.toFixed(1)}</Text>
        <Text style={styles.doctorMetaSep}>·</Text>
        <Text style={styles.doctorMetaText}>{doctor.experienceYears} yrs exp</Text>
        <Text style={styles.doctorMetaSep}>·</Text>
        <Text style={[styles.doctorMetaText, { color: 'rgba(110,231,183,0.85)' }]}>{doctor.bookingsCount.toLocaleString()} booked</Text>
      </View>
    </View>
    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Text style={styles.doctorFee}>₹{doctor.feeRupees}</Text>
      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
    </View>
  </TouchableOpacity>
);

const PartnerRedirectCard = ({ hospital, deptId, nav }: { hospital: HospitalInfo | null; deptId: DepartmentId; nav: any }) => (
  <View style={styles.partnerCard}>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={styles.partnerIcon}>
        <Building2 size={20} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.partnerTitle}>{hospital?.name} is a Google-listed hospital</Text>
        <Text style={styles.partnerDesc}>
          Live appointment booking is available with our partner hospital, Arogya Medicare. Book a {getDepartment(deptId).name} consultation now.
        </Text>
      </View>
    </View>
    <TouchableOpacity activeOpacity={0.85} style={styles.partnerBtn}
      onPress={() => nav.navigate('CareHospital', { hospitalId: SHOWCASE_HOSPITAL.id, deptId })}>
      <Sparkles size={16} color="#ffffff" />
      <Text style={styles.partnerBtnText}>Book with Arogya Medicare</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0b0f' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48, gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  heroCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a' },
  heroBanner: { height: 112, justifyContent: 'flex-end' },
  heroBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroBannerContent: { padding: 16, position: 'relative' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  partnerBadgeText: { fontSize: 9, fontWeight: '900', color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  ratingText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroName: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  heroAddr: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 12 },
  miniStat: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, alignItems: 'center', gap: 4 },
  miniStatValue: { fontSize: 11, fontWeight: '900', color: '#ffffff' },
  miniStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 },
  deptChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, height: 36, marginRight: 8 },
  deptChipActive: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  deptChipText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)' },
  deptChipTextActive: { color: '#0f172a' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', paddingHorizontal: 16 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  doctorCount: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 },
  doctorRow: { flexDirection: 'row', gap: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', padding: 14 },
  doctorAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doctorName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  doctorTitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  doctorQual: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  doctorMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  doctorMetaText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  doctorMetaSep: { fontSize: 10, color: 'rgba(255,255,255,0.15)' },
  doctorFee: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  emptyCard: { borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  partnerCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', padding: 20, gap: 16 },
  partnerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981' },
  partnerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  partnerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16, marginTop: 4 },
  partnerBtn: { height: 44, borderRadius: 16, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  partnerBtnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
