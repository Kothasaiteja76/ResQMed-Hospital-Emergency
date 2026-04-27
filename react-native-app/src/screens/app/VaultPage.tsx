import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FolderHeart, ChevronLeft, Plus, FileText, Image, Activity, Calendar, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenRecords, type MedicalRecord, type RecordType } from '../../data/records';

const TYPE_CONFIG: Record<RecordType, { icon: any; color: string }> = {
  Prescription: { icon: FileText, color: '#3b82f6' },
  LabReport: { icon: Activity, color: '#10b981' },
  XRay: { icon: Image, color: '#8b5cf6' },
  Imaging: { icon: Image, color: '#06b6d4' },
  Consultation: { icon: Calendar, color: '#f59e0b' },
};

export const VaultPage = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    return listenRecords(user.uid, setRecords);
  }, [user]);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>HEALTH VAULT</Text>
            <Text style={[styles.title, { color: colors.text }]}>Medical Records</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
            <Plus size={16} color="#ec4899" />
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <FolderHeart size={32} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyDesc}>Upload prescriptions, lab reports, and scans to keep them safe and accessible.</Text>
          </View>
        ) : (
          <View style={styles.recordList}>
            {records.map((r, i) => {
              const config = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.Prescription;
              const Icon = config.icon;
              return (
                <Animated.View key={r.id} entering={FadeInDown.duration(400).delay(i * 60)}>
                  <TouchableOpacity style={styles.recordCard} activeOpacity={0.7}>
                    <View style={[styles.recordIcon, { backgroundColor: config.color + '20' }]}>
                      <Icon size={18} color={config.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle}>{r.title}</Text>
                      <Text style={styles.recordMeta}>{r.type} · {formatDate(r.recordDate)}</Text>
                      {r.files.length > 0 && (
                        <Text style={styles.recordFiles}>{r.files.length} file{r.files.length > 1 ? 's' : ''}</Text>
                      )}
                    </View>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
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
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#ec4899', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(236,72,153,0.1)', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', backgroundColor: '#13141a', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 260, lineHeight: 18 },
  recordList: { gap: 6 },
  recordCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  recordIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  recordMeta: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  recordFiles: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
});
