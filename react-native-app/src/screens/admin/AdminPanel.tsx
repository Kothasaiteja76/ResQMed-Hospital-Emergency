import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Settings, ChevronLeft, Activity, Wifi, Battery, Gauge, Zap, MapPin } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { setHardwareSensor, listenHardwareSensor, startBackendSimulator, type HardwareSensorDoc } from '../../data/backendAdmin';

export const AdminPanel = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [sensor, setSensor] = useState<HardwareSensorDoc | null>(null);
  const [speed, setSpeed] = useState('0');
  const [impact, setImpact] = useState('0');
  const [tilt, setTilt] = useState('0');

  useEffect(() => {
    if (!user) return;
    return listenHardwareSensor(user.uid, setSensor);
  }, [user]);

  useEffect(() => {
    const unsub = startBackendSimulator();
    return () => unsub();
  }, []);

  const handleUpdateSensor = async () => {
    if (!user) return;
    try {
      await setHardwareSensor(user.uid, {
        uid: user.uid,
        speedKmh: parseFloat(speed) || 0,
        impactG: parseFloat(impact) || 0,
        tiltRatio: parseFloat(tilt) || 0,
        location: { lat: 19.076, lon: 72.8777 },
        isOnline: true,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update sensor');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>ADMIN</Text>
            <Text style={[styles.title, { color: colors.text }]}>Hardware Simulator</Text>
          </View>
        </View>

        {/* Current sensor state */}
        {sensor && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <View style={styles.sensorCard}>
              <Text style={styles.cardLabel}>LIVE SENSOR DATA</Text>
              <View style={styles.sensorGrid}>
                <SensorStat icon={Gauge} label="Speed" value={`${sensor.speedKmh} km/h`} color="#06b6d4" />
                <SensorStat icon={Zap} label="Impact" value={`${sensor.impactG} G`} color="#ef4444" />
                <SensorStat icon={Activity} label="Tilt" value={`${(sensor.tiltRatio * 100).toFixed(0)}%`} color="#f59e0b" />
                <SensorStat icon={Wifi} label="Status" value={sensor.isOnline ? 'Online' : 'Offline'} color={sensor.isOnline ? '#10b981' : '#ef4444'} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Controls */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.controlCard}>
            <Text style={styles.cardLabel}>SIMULATE VALUES</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Speed (km/h)</Text>
              <TextInput style={styles.input} value={speed} onChangeText={setSpeed} keyboardType="numeric" />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Impact (G)</Text>
              <TextInput style={styles.input} value={impact} onChangeText={setImpact} keyboardType="numeric" />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tilt Ratio</Text>
              <TextInput style={styles.input} value={tilt} onChangeText={setTilt} keyboardType="numeric" />
            </View>
            <TouchableOpacity onPress={handleUpdateSensor} activeOpacity={0.85} style={styles.updateBtn}>
              <Text style={styles.updateBtnText}>Update Sensor</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const SensorStat = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <View style={styles.sensorStat}>
    <Icon size={14} color={color} />
    <Text style={styles.sensorLabel}>{label}</Text>
    <Text style={[styles.sensorValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#8b5cf6', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  sensorCard: { backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 12 },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sensorStat: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, gap: 4 },
  sensorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', textTransform: 'uppercase' },
  sensorValue: { fontSize: 16, fontWeight: '900' },
  controlCard: { backgroundColor: '#13141a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  input: { width: 100, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'right' },
  updateBtn: { height: 44, borderRadius: 22, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  updateBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
