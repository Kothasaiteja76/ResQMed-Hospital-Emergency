import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Siren, Phone, AlertCircle, ArrowLeft } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { isDemoMode } from '../../app/env';
import { isPhoneRegistered } from '../../data/user';
import { loginWithPhone } from '../../auth/authActions';

type Step = 'phone' | 'otp';

function validatePhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10) return 'Phone must be exactly 10 digits';
  if (!/^[6-9]/.test(digits)) return 'Number must start with 6, 7, 8, or 9';
  return null;
}

export const LoginPage = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const redirectPath = (route.params as any)?.redirect ?? 'MainTabs';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const digits = phone.replace(/\D/g, '');
  const phoneError = digits.length > 0 ? validatePhone(digits) : null;

  const handleSendOtp = async () => {
    const err = validatePhone(digits);
    if (err) { setError(err); return; }
    setError(null);
    setBusy(true);

    try {
      const registered = await isPhoneRegistered(digits);
      if (!registered) {
        setBusy(false);
        nav.navigate('Signup', { phone: digits, fromLogin: true, redirect: redirectPath });
        return;
      }

      if (isDemoMode) {
        setStep('otp');
        setBusy(false);
        return;
      }

      // In production, use Firebase phone auth
      setStep('otp');
      setBusy(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP');
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setError(null);
    setBusy(true);

    try {
      if (isDemoMode) {
        await loginWithPhone(digits, code);
        nav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        return;
      }

      await loginWithPhone(digits, code);
      nav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP');
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logo}>
              <Siren size={24} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>Arogya Raksha</Text>
          </View>

          <Text style={styles.title}>{step === 'phone' ? 'Welcome back' : 'Verify OTP'}</Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Enter your registered phone to continue'
              : `Enter the 6-digit code sent to +91 ${digits}`}
          </Text>
        </Animated.View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={14} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 'phone' ? (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <Text style={styles.inputLabel}>Phone number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit number"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>
            {phoneError && digits.length >= 4 && (
              <Text style={styles.fieldError}>{phoneError}</Text>
            )}

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={busy || !!phoneError}
              activeOpacity={0.85}
              style={[styles.submitBtn, (busy || !!phoneError) && styles.submitBtnDisabled]}
            >
              <Phone size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>{busy ? 'Sending…' : 'Send OTP'}</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => nav.navigate('Signup', {})}>
                <Text style={styles.signupLink}> Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <Text style={styles.inputLabel}>OTP Code</Text>
            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={styles.otpInput}
                  value={d}
                  onChangeText={(t) => handleOtpChange(t, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </View>

            {isDemoMode && (
              <Text style={styles.demoHint}>Demo mode — enter any 6 digits</Text>
            )}

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={busy}
              activeOpacity={0.85}
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
            >
              <Text style={styles.submitBtnText}>{busy ? 'Verifying…' : 'Verify & Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(null); }}>
              <Text style={styles.changePhone}>← Change phone number</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b0f' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 16, padding: 12, marginTop: 16 },
  errorText: { color: '#fca5a5', fontSize: 12, flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: { height: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  countryCodeText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  phoneInput: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  fieldError: { color: '#fca5a5', fontSize: 11, marginTop: 6 },
  submitBtn: {
    height: 52, borderRadius: 26, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  signupText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  signupLink: { color: '#10b981', fontSize: 13, fontWeight: '800' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpInput: { width: 48, height: 56, borderRadius: 16, backgroundColor: '#13141a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center', color: '#ffffff', fontSize: 22, fontWeight: '800' },
  demoHint: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 },
  changePhone: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16, textDecorationLine: 'underline' },
});
