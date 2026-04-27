import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Siren, Phone, AlertCircle, ArrowLeft, Plus, X, CheckCircle2 } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { isDemoMode } from '../../app/env';
import { signupWithPhone } from '../../auth/authActions';
import { updateUserProfile, registerPhoneIndex } from '../../data/user';

type Step = 'phone' | 'otp' | 'profile';

interface EmergencyContact {
  name: string;
  phone: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const SignupPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as any ?? {};
  const preVerifiedUid = params.uid as string | undefined;
  const preVerifiedPhone = params.phone as string | undefined;
  const redirectPath = params.redirect as string | undefined;
  const fromLogin = Boolean(params.fromLogin);

  const [step, setStep] = useState<Step>(preVerifiedUid ? 'profile' : 'phone');
  const [phone, setPhone] = useState(preVerifiedPhone || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ name: '', phone: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [finalUid, setFinalUid] = useState<string | null>(preVerifiedUid || null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = async () => {
    const d = phone.replace(/\D/g, '');
    if (d.length !== 10) { setError('Phone must be exactly 10 digits.'); return; }
    if (!/^[6-9]/.test(d)) { setError('Number must start with 6, 7, 8, or 9.'); return; }
    setError(null);
    setBusy(true);

    if (isDemoMode) {
      setStep('otp');
      setBusy(false);
      return;
    }

    // In production, use Firebase phone auth here
    setStep('otp');
    setBusy(false);
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setError(null);
    setBusy(true);

    try {
      if (isDemoMode) {
        const uid = `user-${phone.replace(/\D/g, '')}`;
        setFinalUid(uid);
        setStep('profile');
        setBusy(false);
        return;
      }
      setStep('profile');
      setBusy(false);
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP');
      setBusy(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    const validContacts = contacts.filter((c) => c.name.trim() && c.phone.replace(/\D/g, '').length >= 10);
    setError(null);
    setBusy(true);

    try {
      await signupWithPhone({
        phone: phone.replace(/\D/g, ''),
        name: name.trim(),
        bloodGroup,
        emergencyContacts: validContacts,
      });
      setSuccess(true);
      setTimeout(() => {
        nav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }, 1500);
    } catch (e: any) {
      setError(e?.message || 'Signup failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const addContact = () => {
    if (contacts.length < 5) setContacts([...contacts, { name: '', phone: '' }]);
  };

  const removeContact = (idx: number) => {
    if (contacts.length <= 1) return;
    setContacts(contacts.filter((_, i) => i !== idx));
  };

  if (success) {
    return (
      <View style={[styles.container, styles.center]}>
        <CheckCircle2 size={48} color="#10b981" />
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSub}>Redirecting to dashboard…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Siren size={24} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>Arogya Raksha</Text>
        </View>

        <Text style={styles.title}>
          {step === 'phone' ? 'Create account' : step === 'otp' ? 'Verify OTP' : 'Complete profile'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone' ? 'Sign up with your phone number' : step === 'otp' ? `Enter the 6-digit code sent to +91 ${phone.replace(/\D/g, '')}` : 'Tell us about yourself'}
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={14} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 'phone' && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Text style={styles.inputLabel}>Phone number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput style={styles.phoneInput} placeholder="10-digit number" placeholderTextColor="rgba(255,255,255,0.25)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} autoFocus />
            </View>
            <TouchableOpacity onPress={handleSendOtp} disabled={busy} activeOpacity={0.85} style={[styles.submitBtn, busy && styles.disabled]}>
              <Phone size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>{busy ? 'Sending…' : 'Send OTP'}</Text>
            </TouchableOpacity>
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => nav.navigate('Login', {})}>
                <Text style={styles.link}> Log in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 'otp' && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Text style={styles.inputLabel}>OTP Code</Text>
            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <TextInput key={i} ref={(r) => { otpRefs.current[i] = r; }} style={styles.otpInput} value={d} onChangeText={(t) => handleOtpChange(t, i)} keyboardType="number-pad" maxLength={1} autoFocus={i === 0} />
              ))}
            </View>
            {isDemoMode && <Text style={styles.demoHint}>Demo mode — enter any 6 digits</Text>}
            <TouchableOpacity onPress={handleVerifyOtp} disabled={busy} activeOpacity={0.85} style={[styles.submitBtn, busy && styles.disabled]}>
              <Text style={styles.submitBtnText}>{busy ? 'Verifying…' : 'Verify'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 'profile' && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput style={styles.textInput} placeholder="Your full name" placeholderTextColor="rgba(255,255,255,0.25)" value={name} onChangeText={setName} />

            <Text style={styles.inputLabel}>Blood Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity key={bg} onPress={() => setBloodGroup(bg)} activeOpacity={0.7} style={[styles.chip, bloodGroup === bg && styles.chipActive]}>
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Emergency Contacts</Text>
            {contacts.map((c, idx) => (
              <View key={idx} style={styles.contactRow}>
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Name" placeholderTextColor="rgba(255,255,255,0.25)" value={c.name} onChangeText={(t) => { const n = [...contacts]; n[idx] = { ...c, name: t }; setContacts(n); }} />
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Phone" placeholderTextColor="rgba(255,255,255,0.25)" value={c.phone} onChangeText={(t) => { const n = [...contacts]; n[idx] = { ...c, phone: t }; setContacts(n); }} keyboardType="phone-pad" />
                {contacts.length > 1 && (
                  <TouchableOpacity onPress={() => removeContact(idx)} style={styles.removeBtn}>
                    <X size={14} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {contacts.length < 5 && (
              <TouchableOpacity onPress={addContact} style={styles.addContactBtn}>
                <Plus size={14} color="rgba(255,255,255,0.5)" />
                <Text style={styles.addContactText}>Add contact</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleCompleteProfile} disabled={busy} activeOpacity={0.85} style={[styles.submitBtn, busy && styles.disabled]}>
              <Text style={styles.submitBtnText}>{busy ? 'Creating…' : 'Create Account'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 16, padding: 12, marginTop: 16 },
  errorText: { color: '#fca5a5', fontSize: 12, flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: { height: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  countryCodeText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  phoneInput: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  textInput: { height: 48, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, color: '#ffffff', fontSize: 14, marginBottom: 8 },
  submitBtn: { height: 52, borderRadius: 26, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  linkText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  link: { color: '#10b981', fontSize: 13, fontWeight: '800' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpInput: { width: 48, height: 56, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center', color: '#ffffff', fontSize: 22, fontWeight: '800' },
  demoHint: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 },
  chipScroll: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
  chipActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#ef4444' },
  contactRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addContactText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  successTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 16 },
  successSub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4 },
});
