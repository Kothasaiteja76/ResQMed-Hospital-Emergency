import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';

export type Gender = 'male' | 'female' | 'other' | '';

export interface SavedAddress {
  id: string;
  label: 'home' | 'work' | 'other';
  name?: string;
  line: string;
  lat?: number;
  lon?: number;
}

export function computeAgeFromDob(dob?: string): number | undefined {
  if (!dob || !/^\d{4}-\d{2}-\d{2}/.test(dob)) return undefined;
  const b = new Date(dob + 'T12:00:00');
  if (Number.isNaN(b.getTime())) return undefined;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return Math.max(0, a);
}

export function shortAddressFromProfile(p: UserProfile | null | undefined): string | undefined {
  if (!p?.addresses?.length) return undefined;
  const a = p.addresses.find((x) => x.label === 'home') ?? p.addresses[0];
  const line = (a?.line ?? '').trim();
  if (!line) return undefined;
  return line.length > 44 ? `${line.slice(0, 42)}…` : line;
}

export interface UserProfile {
  uid: string;
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: Gender;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  addresses?: SavedAddress[];
  fcmToken?: string;
  points?: number;
  helpedCount?: number;
  location?: { lat: number; lon: number };
  contacts: { name: string; phone: string; relation?: string }[];
}

const DEMO_KEY = 'resqmed_demo_user_v1';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isDemoMode) {
    const raw = await getItem(DEMO_KEY);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      if (u.uid !== uid) return null;
      return {
        uid: u.uid,
        name: u.displayName || u.name,
        phone: u.phone,
        email: u.email,
        dob: u.dob || '',
        gender: u.gender || '',
        bloodGroup: u.bloodGroup || '',
        allergies: u.allergies || '',
        medicalConditions: u.medicalConditions || '',
        medications: u.medications || '',
        addresses: u.addresses || [],
        contacts: u.emergencyContacts || u.contacts || [],
      } as UserProfile;
    } catch { return null; }
  }
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function isPhoneRegistered(phone: string): Promise<boolean> {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return false;

  if (isDemoMode) {
    const raw = await getItem(DEMO_KEY);
    if (!raw) return false;
    try {
      const u = JSON.parse(raw);
      const stored = String(u.phone || '').replace(/\D/g, '');
      return stored === clean;
    } catch { return false; }
  }

  try {
    const snap = await getDoc(doc(db, 'phoneIndex', clean));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function registerPhoneIndex(phone: string, uid: string) {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return;
  if (isDemoMode) return;
  try {
    await setDoc(doc(db, 'phoneIndex', clean), { uid }, { merge: true });
  } catch (e) {
    console.warn('phoneIndex write failed:', e);
  }
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>) {
  if (isDemoMode) {
    try {
      const raw = await getItem(DEMO_KEY);
      if (!raw) return;
      const u = JSON.parse(raw);
      if (u.uid !== uid) return;
      const merged = {
        ...u,
        ...patch,
        displayName: patch.name ?? u.displayName,
        emergencyContacts: patch.contacts ?? u.emergencyContacts,
      };
      await setItem(DEMO_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
    return;
  }
  await setDoc(doc(db, 'users', uid), patch, { merge: true });
}

export function listenUserProfile(uid: string, cb: (p: UserProfile | null) => void): () => void {
  if (!uid) { cb(null); return () => {}; }

  if (isDemoMode) {
    const tick = async () => {
      const raw = await getItem(DEMO_KEY);
      if (!raw) { cb(null); return; }
      try {
        const u = JSON.parse(raw);
        if (u.uid !== uid) { cb(null); return; }
        cb({
          uid: u.uid,
          name: u.displayName || u.name,
          phone: u.phone,
          email: u.email,
          dob: u.dob || '',
          gender: u.gender || '',
          bloodGroup: u.bloodGroup || '',
          allergies: u.allergies || '',
          medicalConditions: u.medicalConditions || '',
          medications: u.medications || '',
          addresses: u.addresses || [],
          contacts: u.emergencyContacts || u.contacts || [],
          points: u.points,
          helpedCount: u.helpedCount,
        } as UserProfile);
      } catch { cb(null); }
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }

  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
    () => cb(null),
  );
}

export async function rewardHelperPoints(uid: string, points: number = 200) {
  if (!uid) return;
  if (isDemoMode) {
    const raw = await getItem(DEMO_KEY);
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      u.points = (u.points || 0) + points;
      u.helpedCount = (u.helpedCount || 0) + 1;
      await setItem(DEMO_KEY, JSON.stringify(u));
    } catch { /* ignore */ }
    return;
  }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  await setDoc(ref, {
    points: ((data as any).points || 0) + points,
    helpedCount: ((data as any).helpedCount || 0) + 1,
  }, { merge: true });
}

export async function requestAndSaveFcmToken(_uid: string) {
  // FCM token handling is different in React Native.
  // Use expo-notifications or @react-native-firebase/messaging
  console.log('[RN] FCM token request skipped — use expo-notifications');
}
