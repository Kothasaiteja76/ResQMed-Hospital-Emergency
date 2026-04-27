import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Search, MapPin, Star, ChevronLeft, Building2, Phone, Sparkles, X } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  DEPARTMENTS, SHOWCASE_HOSPITAL, findNearbyHospitals, formatDistanceKm, getDepartment,
  type DepartmentId, type HospitalInfo,
} from '../data/hospitals';
import { useSharedLocation } from '../hooks/useSharedLocation';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { setItem } from '../lib/storage';

export const CareHospitalsPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CareDepartment'>>();
  const deptId = (route.params?.deptId || 'general') as DepartmentId;
  const dept = getDepartment(deptId);

  const { currentLocation, requestGPS } = useSharedLocation();
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!currentLocation) void requestGPS({ silent: true });
  }, []);

  useEffect(() => {
    if (!currentLocation) return;
    setLoading(true);
    findNearbyHospitals({ lat: currentLocation.lat, lon: currentLocation.lon }, 8)
      .then((list) => setHospitals(list.filter((h) => !String(h.id || '').startsWith('demo_nearby_'))))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, [currentLocation?.lat, currentLocation?.lon]);

  const merged = useMemo<HospitalInfo[]>(() => {
    const list: HospitalInfo[] = [
      { ...SHOWCASE_HOSPITAL, distanceKm: undefined },
      ...hospitals,
    ];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((h) =>
      h.name.toLowerCase().includes(needle) ||
      (h.address || '').toLowerCase().includes(needle) ||
      (h.tagline || '').toLowerCase().includes(needle)
    );
  }, [hospitals, query]);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backRow}>
          <ChevronLeft size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.backText}>Departments</Text>
        </TouchableOpacity>

        {/* Department hero */}
        <View style={[styles.deptHero, { backgroundColor: '#0891b2' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.deptIcon}><Text style={{ fontSize: 24 }}>{dept.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deptPreLabel}>Department</Text>
              <Text style={styles.deptName}>{dept.name}</Text>
              <Text style={styles.deptTagline}>{dept.tagline}</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.3)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search hospital by name or area"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.searchInput}
          />
          {query.trim() !== '' && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Location button */}
        <TouchableOpacity onPress={() => setShowManual(true)} style={styles.locationBtn} activeOpacity={0.7}>
          <MapPin size={14} color="#38bdf8" />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation
              ? `Near ${currentLocation.displayName || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`}`
              : 'Tap to set your location'}
          </Text>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>

        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {loading ? 'Finding hospitals…' : `${merged.length} hospital${merged.length === 1 ? '' : 's'}`}
          </Text>
          {loading && <ActivityIndicator size="small" color="#38bdf8" />}
        </View>

        {/* Hospitals list */}
        {merged.map((h) => (
          <HospitalRow key={h.id} hospital={h} deptId={deptId} nav={nav} />
        ))}

        {!loading && merged.length === 0 && (
          <View style={styles.emptyCard}>
            <Building2 size={28} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>
              {query.trim() ? 'No matches for your search' : 'No hospitals found nearby'}
            </Text>
            <Text style={styles.emptyDesc}>
              {query.trim() ? 'Clear search or try a shorter keyword.' : 'Try another location.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {showManual && (
        <LocationSearchModal
          onClose={() => setShowManual(false)}
          onSelect={(r) => {
            const loc = { lat: r.lat, lon: r.lon, displayName: r.displayName, source: 'manual' as const, timestamp: Date.now() };
            setItem('arogya_raksha_location', JSON.stringify(loc));
            setShowManual(false);
          }}
        />
      )}
    </View>
  );
};

const HospitalRow = ({ hospital, deptId, nav }: { hospital: HospitalInfo; deptId: DepartmentId; nav: any }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={styles.hospitalCard}
    onPress={() => nav.navigate('CareHospital', { hospitalId: hospital.id, deptId })}
  >
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={[styles.hospitalThumb, hospital.isShowcase && { backgroundColor: '#0891b2' }]}>
        {!hospital.photoUrl && (
          <Building2 size={24} color={hospital.isShowcase ? '#ffffff' : 'rgba(255,255,255,0.4)'} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {hospital.isShowcase && (
            <View style={styles.partnerBadge}>
              <Sparkles size={10} color="#6ee7b7" />
              <Text style={styles.partnerText}>Partner</Text>
            </View>
          )}
          {typeof hospital.rating === 'number' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Star size={12} color="#fbbf24" />
              <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.hospitalName} numberOfLines={1}>{hospital.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <MapPin size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.hospitalAddr} numberOfLines={1}>{hospital.address || hospital.tagline || 'Location unavailable'}</Text>
        </View>
        <View style={styles.hospitalMeta}>
          {hospital.distanceKm !== undefined ? (
            <Text style={styles.metaText}>📍 {formatDistanceKm(hospital.distanceKm)} away</Text>
          ) : hospital.isShowcase ? (
            <Text style={[styles.metaText, { color: 'rgba(110,231,183,0.9)' }]}>✨ Available everywhere</Text>
          ) : null}
          {hospital.openingHours && (
            <Text style={[styles.metaText, { color: 'rgba(110,231,183,0.8)' }]}>{hospital.openingHours}</Text>
          )}
          {hospital.isShowcase && hospital.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Phone size={12} color="rgba(255,255,255,0.55)" />
              <Text style={styles.metaText}>24×7</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0b0f' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48, gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  deptHero: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  deptIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  deptPreLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2 },
  deptName: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  deptTagline: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', paddingHorizontal: 16 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', paddingHorizontal: 12, paddingVertical: 10 },
  locationText: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  changeText: { fontSize: 10, fontWeight: '700', color: '#38bdf8' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 },
  hospitalCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#13141a', padding: 14, overflow: 'hidden' },
  hospitalThumb: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1c1d25', alignItems: 'center', justifyContent: 'center' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 6, paddingVertical: 1 },
  partnerText: { fontSize: 9, fontWeight: '900', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: 1 },
  ratingText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  hospitalName: { fontSize: 14, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  hospitalAddr: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  hospitalMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  emptyCard: { borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
});
