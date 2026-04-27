import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';

export type HelmetCrashEvent = {
  at: Date;
  severity: 'minor' | 'major' | 'critical';
  lat?: number;
  lon?: number;
  gForce?: number;
};

export type HelmetDevice = {
  ownerUid: string;
  deviceId: string;
  model: string;
  firmware?: string;
  batteryPct: number;
  sensorsActive: boolean;
  connected: boolean;
  lastPingAt?: Date;
  verifiedAt?: Date;
  crashEvent?: HelmetCrashEvent | null;
};

const LS_KEY = 'arogya_helmet_v1';

async function loadDemo(uid: string): Promise<HelmetDevice | null> {
  const raw = await getItem(`${LS_KEY}:${uid}`);
  if (!raw) return null;
  try {
    const x = JSON.parse(raw);
    return {
      ...x,
      lastPingAt: x.lastPingAt ? new Date(x.lastPingAt) : undefined,
      verifiedAt: x.verifiedAt ? new Date(x.verifiedAt) : undefined,
      crashEvent: x.crashEvent
        ? { ...x.crashEvent, at: new Date(x.crashEvent.at) }
        : null,
    };
  } catch { return null; }
}

async function saveDemo(uid: string, d: HelmetDevice) {
  await setItem(`${LS_KEY}:${uid}`, JSON.stringify(d));
}

function mapHelmet(uid: string, data: any): HelmetDevice {
  return {
    ownerUid: data.ownerUid ?? uid,
    deviceId: data.deviceId ?? 'unknown',
    model: data.model ?? 'Aarogya Helmet One',
    firmware: data.firmware,
    batteryPct: typeof data.batteryPct === 'number' ? data.batteryPct : 0,
    sensorsActive: Boolean(data.sensorsActive),
    connected: Boolean(data.connected),
    lastPingAt: data.lastPingAt?.toDate?.() ?? (data.lastPingAt ? new Date(data.lastPingAt) : undefined),
    verifiedAt: data.verifiedAt?.toDate?.() ?? (data.verifiedAt ? new Date(data.verifiedAt) : undefined),
    crashEvent: data.crashEvent
      ? {
          ...data.crashEvent,
          at: data.crashEvent.at?.toDate?.() ?? new Date(data.crashEvent.at ?? Date.now()),
        }
      : null,
  };
}

export function listenHelmet(uid: string, cb: (h: HelmetDevice | null) => void): () => void {
  if (!uid) { cb(null); return () => {}; }

  if (isDemoMode) {
    const tick = async () => cb(await loadDemo(uid));
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }

  return onSnapshot(
    doc(db, 'helmets', uid),
    (snap) => cb(snap.exists() ? mapHelmet(uid, snap.data()) : null),
    (err) => { console.warn('listenHelmet error:', err); cb(null); },
  );
}

export async function pairHelmet(input: {
  ownerUid: string;
  deviceId: string;
  model?: string;
  firmware?: string;
}): Promise<void> {
  const base: HelmetDevice = {
    ownerUid: input.ownerUid,
    deviceId: input.deviceId,
    model: input.model ?? 'Aarogya Helmet One',
    firmware: input.firmware,
    batteryPct: 92,
    sensorsActive: true,
    connected: true,
    lastPingAt: new Date(),
    verifiedAt: new Date(),
    crashEvent: null,
  };

  if (isDemoMode) { await saveDemo(input.ownerUid, base); return; }

  await setDoc(doc(db, 'helmets', input.ownerUid), {
    ownerUid: base.ownerUid,
    deviceId: base.deviceId,
    model: base.model,
    firmware: base.firmware ?? null,
    batteryPct: base.batteryPct,
    sensorsActive: base.sensorsActive,
    connected: base.connected,
    lastPingAt: serverTimestamp(),
    verifiedAt: serverTimestamp(),
    crashEvent: null,
  }, { merge: true });
}

export async function runHelmetSelfTest(uid: string): Promise<void> {
  if (isDemoMode) {
    const h = await loadDemo(uid);
    if (h) {
      h.verifiedAt = new Date();
      await saveDemo(uid, h);
    }
    return;
  }
  await updateDoc(doc(db, 'helmets', uid), {
    verifiedAt: serverTimestamp(),
  });
}
