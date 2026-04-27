import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Building2, Search, MapPin, Star, ShieldCheck, Send, X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import {
  SHOWCASE_HOSPITAL,
  findNearbyHospitals,
  formatDistanceKm,
  type HospitalInfo,
} from '../data/hospitals';
import {
  notifyHospital,
  cancelHospitalAlert,
  listenMyAlertForRequest,
  type HospitalAlert,
} from '../data/hospitalAlerts';
import type { SosSeverity } from '../data/sos';

type Props = {
  requestId: string;
  victimId: string;
  helperId: string;
  helperName?: string;
  victimLocation: { lat: number; lon: number };
  severity?: SosSeverity;
};

export const HospitalAlertPanel = ({
  requestId, victimId, helperId, helperName, victimLocation, severity,
}: Props) => {
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<HospitalInfo | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<HospitalAlert | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await findNearbyHospitals(victimLocation, 10);
        if (cancelled) return;
        const showcase: HospitalInfo = { ...SHOWCASE_HOSPITAL, distanceKm: 0.4 };
        const seen = new Set<string>();
        const merged = [showcase, ...list].filter((h) => {
          if (seen.has(h.id)) return false;
          seen.add(h.id);
          return true;
        });
        setHospitals(merged);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load hospitals.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [victimLocation.lat, victimLocation.lon]);

  useEffect(() => {
    if (!helperId || !requestId) return;
    return listenMyAlertForRequest(requestId, helperId, setActiveAlert);
  }, [requestId, helperId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return hospitals;
    return hospitals.filter((h) =>
      h.name.toLowerCase().includes(needle) ||
      (h.address || '').toLowerCase().includes(needle)
    );
  }, [hospitals, query]);

  const submit = async () => {
    if (!picked) { setErr('Pick a hospital first.'); return; }
    setBusy(true); setErr(null);
    try {
      await notifyHospital({
        requestId,
        victimId,
        helperId,
        helperName,
        hospitalId: picked.id,
        hospitalName: picked.name,
        hospitalAddress: picked.address,
        hospitalLocation: picked.location,
        distanceFromSosKm: picked.distanceKm,
        severity,
        victimLocation,
        injuryNotes: notes.trim() || undefined,
      });
      setPicked(null);
      setNotes('');
    } catch (e: any) {
      setErr(e?.message || 'Failed to notify hospital.');
    } finally {
      setBusy(false);
    }
  };

  const reroute = async () => {
    if (!activeAlert) return;
    setBusy(true); setErr(null);
    try { await cancelHospitalAlert(activeAlert.id); }
    catch (e: any) { setErr(e?.message || 'Failed to cancel alert.'); }
    finally { setBusy(false); }
  };

  if (activeAlert) {
    return (
      <View style={styles.alertedCard}>
        <View style={styles.alertedRow}>
          <View style={styles.alertedIcon}>
            <ShieldCheck size={16} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertedLabel}>Successfully notified</Text>
            <Text style={styles.alertedDesc}>ER is preparing for treatment — stay with the person until handover.</Text>
            <Text style={styles.alertedHospital}>{activeAlert.hospitalName}</Text>
            {activeAlert.hospitalAddress && (
              <View style={styles.addrRow}>
                <MapPin size={10} color="rgba(255,255,255,0.4)" />
                <Text style={styles.addrText}>{activeAlert.hospitalAddress}</Text>
              </View>
            )}
            <Text style={styles.alertedStatus}>
              {activeAlert.status === 'acknowledged' ? 'ER team acknowledged' : 'Waiting for ER acknowledgement…'}
            </Text>
          </View>
        </View>
        {activeAlert.injuryNotes && (
          <View style={styles.noteBubble}>
            <Text style={styles.noteLabel}>NOTE </Text>
            <Text style={styles.noteText}>{activeAlert.injuryNotes}</Text>
          </View>
        )}
        <TouchableOpacity onPress={reroute} disabled={busy} activeOpacity={0.7}>
          <Text style={styles.rerouteText}>Re-route to a different hospital</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.pickerCard}>
      <View style={styles.pickerHeader}>
        <Building2 size={14} color="#93c5fd" />
        <Text style={styles.pickerLabel}>Alert a nearby hospital</Text>
      </View>
      <Text style={styles.pickerDesc}>
        Pick the hospital you're heading to. We'll notify their ER so treatment is ready.
      </Text>

      <View style={styles.searchBox}>
        <Search size={14} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search hospital"
          placeholderTextColor="rgba(255,255,255,0.25)"
        />
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#93c5fd" />
          <Text style={styles.loadingText}>Finding hospitals near the incident…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.noResults}>No hospitals found near this location.</Text>
      ) : (
        <ScrollView style={styles.hospitalList} nestedScrollEnabled>
          {filtered.map((h) => {
            const isPicked = picked?.id === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => setPicked(h)}
                activeOpacity={0.7}
                style={[styles.hospitalRow, isPicked && styles.hospitalRowPicked]}
              >
                <View style={[styles.hospitalIcon, h.isShowcase && styles.hospitalIconShowcase]}>
                  <Text style={{ fontSize: 14 }}>🏥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hospitalName}>{h.name}</Text>
                  <Text style={styles.hospitalAddr}>{h.address || '—'}</Text>
                  <View style={styles.hospitalMeta}>
                    {typeof h.distanceKm === 'number' && (
                      <Text style={styles.hospitalDist}>{formatDistanceKm(h.distanceKm)}</Text>
                    )}
                    {typeof h.rating === 'number' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Star size={10} color="#f59e0b" />
                        <Text style={styles.hospitalRating}>{h.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isPicked && <CheckCircle2 size={16} color="#6ee7b7" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Briefly describe the injury…"
        placeholderTextColor="rgba(255,255,255,0.25)"
        multiline
        numberOfLines={2}
      />

      {err && (
        <View style={styles.errRow}>
          <AlertTriangle size={12} color="#fca5a5" />
          <Text style={styles.errText}>{err}</Text>
          <TouchableOpacity onPress={() => setErr(null)}><X size={12} color="rgba(252,165,165,0.6)" /></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={submit}
        disabled={busy || !picked}
        activeOpacity={0.85}
        style={[styles.submitBtn, (busy || !picked) && { opacity: 0.4 }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Send size={14} color="#ffffff" />
            <Text style={styles.submitText}>{picked ? `Notify ${picked.name}` : 'Notify hospital'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  alertedCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.07)', padding: 14, gap: 8 },
  alertedRow: { flexDirection: 'row', gap: 12 },
  alertedIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981' },
  alertedLabel: { fontSize: 10, fontWeight: '900', color: '#6ee7b7', letterSpacing: 2, textTransform: 'uppercase' },
  alertedDesc: { fontSize: 11, fontWeight: '800', color: 'rgba(16,185,129,0.9)', lineHeight: 16 },
  alertedHospital: { fontSize: 14, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  addrText: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  alertedStatus: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  noteBubble: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 8 },
  noteLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.4)' },
  noteText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 },
  rerouteText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.55)', textDecorationLine: 'underline' },
  pickerCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', backgroundColor: 'rgba(59,130,246,0.05)', padding: 12, gap: 10 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickerLabel: { fontSize: 10, fontWeight: '900', color: '#bfdbfe', letterSpacing: 2, textTransform: 'uppercase' },
  pickerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  loadingText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  noResults: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 16 },
  hospitalList: { maxHeight: 200 },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 8, marginBottom: 6 },
  hospitalRowPicked: { borderColor: 'rgba(16,185,129,0.45)', backgroundColor: 'rgba(16,185,129,0.1)' },
  hospitalIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.15)' },
  hospitalIconShowcase: { backgroundColor: '#10b981' },
  hospitalName: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  hospitalAddr: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  hospitalMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  hospitalDist: { fontSize: 10, fontWeight: '700', color: '#93c5fd' },
  hospitalRating: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  notesInput: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 11 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errText: { flex: 1, fontSize: 11, color: '#fca5a5' },
  submitBtn: { height: 40, borderRadius: 12, backgroundColor: '#1d4ed8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  submitText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
