import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Users, Plus, X, Phone, ChevronLeft, CheckCircle2, Edit3 } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../app/ThemeContext';
import { listenUserProfile, updateUserProfile, type UserProfile } from '../../data/user';

interface EmergencyContact {
  name: string;
  phone: string;
}

export const SafetyCirclePage = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenUserProfile(user.uid, (p) => {
      setProfile(p);
      setContacts(p?.emergencyContacts ?? []);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { emergencyContacts: contacts.filter((c) => c.name.trim() || c.phone.trim()) });
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
            <Text style={styles.headerBadge}><Users size={14} color="#06b6d4" /> SAFETY CIRCLE</Text>
            <Text style={[styles.title, { color: colors.text }]}>Emergency Contacts</Text>
          </View>
          <TouchableOpacity onPress={() => editing ? save() : setEditing(true)} style={styles.editBtn} activeOpacity={0.7}>
            {editing ? <CheckCircle2 size={16} color="#10b981" /> : <Edit3 size={16} color="rgba(255,255,255,0.5)" />}
          </TouchableOpacity>
        </View>

        {contacts.length === 0 && !editing && (
          <View style={styles.emptyCard}>
            <Users size={32} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyDesc}>Add emergency contacts who will be notified during SOS.</Text>
            <TouchableOpacity onPress={() => { setEditing(true); setContacts([{ name: '', phone: '' }]); }} style={styles.addBtn} activeOpacity={0.7}>
              <Plus size={14} color="#06b6d4" />
              <Text style={styles.addBtnText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        )}

        {contacts.map((c, i) => (
          <Animated.View key={i} entering={FadeInDown.duration(400).delay(i * 60)}>
            {editing ? (
              <View style={styles.editCard}>
                <TextInput style={styles.input} placeholder="Name" placeholderTextColor="rgba(255,255,255,0.25)" value={c.name} onChangeText={(t) => { const n = [...contacts]; n[i] = { ...c, name: t }; setContacts(n); }} />
                <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="rgba(255,255,255,0.25)" value={c.phone} onChangeText={(t) => { const n = [...contacts]; n[i] = { ...c, phone: t }; setContacts(n); }} keyboardType="phone-pad" />
                <TouchableOpacity onPress={() => setContacts(contacts.filter((_, idx) => idx !== i))} style={styles.removeBtn}>
                  <X size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>{(c.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name || 'Unnamed'}</Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </View>
                <Phone size={14} color="rgba(255,255,255,0.25)" />
              </View>
            )}
          </Animated.View>
        ))}

        {editing && contacts.length < 5 && (
          <TouchableOpacity onPress={() => setContacts([...contacts, { name: '', phone: '' }])} style={styles.addMore} activeOpacity={0.7}>
            <Plus size={14} color="rgba(255,255,255,0.4)" />
            <Text style={styles.addMoreText}>Add contact</Text>
          </TouchableOpacity>
        )}

        {editing && (
          <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.85} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Contacts'}</Text>
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
  headerBadge: { fontSize: 10, fontWeight: '900', color: '#06b6d4', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', backgroundColor: '#13141a', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  emptyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 260 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(6,182,212,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginTop: 8 },
  addBtnText: { color: '#06b6d4', fontSize: 12, fontWeight: '800' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#13141a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 6 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(6,182,212,0.15)', alignItems: 'center', justifyContent: 'center' },
  contactInitial: { color: '#06b6d4', fontSize: 16, fontWeight: '900' },
  contactName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  contactPhone: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  editCard: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, color: '#ffffff', fontSize: 13 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addMoreText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
  saveBtn: { height: 48, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
