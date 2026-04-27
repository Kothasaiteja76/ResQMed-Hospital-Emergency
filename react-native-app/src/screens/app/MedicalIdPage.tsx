import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Heart, ChevronLeft, Edit3, CheckCircle2, Droplets, AlertCircle, Pill } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenUserProfile, updateUserProfile, type UserProfile } from '../../data/user';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const MedicalIdPage = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenUserProfile(user.uid, (p) => {
      setProfile(p);
      setBloodGroup(p?.bloodGroup ?? '');
      setAllergies(p?.allergies ?? '');
      setMedications(p?.medications ?? '');
      setConditions(p?.conditions ?? '');
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { bloodGroup, allergies, medications, conditions });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>MEDICAL ID</Text>
            <Text style={[styles.title, { color: colors.text }]}>Health Information</Text>
          </View>
          <TouchableOpacity onPress={() => editing ? save() : setEditing(true)} style={styles.editBtn} activeOpacity={0.7}>
            {editing ? <CheckCircle2 size={16} color="#10b981" /> : <Edit3 size={16} color="rgba(255,255,255,0.5)" />}
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.fieldLabel}>Blood Group</Text>
          {editing ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity key={bg} onPress={() => setBloodGroup(bg)} activeOpacity={0.7} style={[styles.chip, bloodGroup === bg && styles.chipActive]}>
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.fieldCard}>
              <Droplets size={16} color="#ef4444" />
              <Text style={styles.fieldValue}>{bloodGroup || 'Not set'}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.fieldLabel}>Allergies</Text>
          {editing ? (
            <TextInput style={styles.textInput} placeholder="e.g. Penicillin, Peanuts" placeholderTextColor="rgba(255,255,255,0.25)" value={allergies} onChangeText={setAllergies} multiline />
          ) : (
            <View style={styles.fieldCard}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.fieldValue}>{allergies || 'None listed'}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Text style={styles.fieldLabel}>Current Medications</Text>
          {editing ? (
            <TextInput style={styles.textInput} placeholder="e.g. Metformin 500mg" placeholderTextColor="rgba(255,255,255,0.25)" value={medications} onChangeText={setMedications} multiline />
          ) : (
            <View style={styles.fieldCard}>
              <Pill size={16} color="#3b82f6" />
              <Text style={styles.fieldValue}>{medications || 'None listed'}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Text style={styles.fieldLabel}>Medical Conditions</Text>
          {editing ? (
            <TextInput style={styles.textInput} placeholder="e.g. Diabetes Type 2" placeholderTextColor="rgba(255,255,255,0.25)" value={conditions} onChangeText={setConditions} multiline />
          ) : (
            <View style={styles.fieldCard}>
              <Heart size={16} color="#ec4899" />
              <Text style={styles.fieldValue}>{conditions || 'None listed'}</Text>
            </View>
          )}
        </Animated.View>

        {editing && (
          <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.85} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Medical ID'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#ef4444', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  fieldCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#13141a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  fieldValue: { fontSize: 14, fontWeight: '700', color: '#ffffff', flex: 1 },
  chipScroll: { flexDirection: 'row', marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
  chipActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: '#ef4444' },
  textInput: { minHeight: 48, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 12, color: '#ffffff', fontSize: 14 },
  saveBtn: { height: 48, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
