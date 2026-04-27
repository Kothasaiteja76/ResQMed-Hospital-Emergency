import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';
import type { SosSeverity } from './sos';

export type HospitalAlertStatus =
  | 'notified'
  | 'acknowledged'
  | 'arrived'
  | 'cancelled';

export type HospitalAlert = {
  id: string;
  requestId: string;
  victimId: string;
  helperId: string;
  helperName?: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalLocation?: { lat: number; lon: number };
  distanceFromSosKm?: number;
  severity?: SosSeverity;
  victimLocation?: { lat: number; lon: number };
  injuryNotes?: string;
  suggestedDept?: string;
  status: HospitalAlertStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

const LS_KEY = 'arogya_hospital_alerts_v1';

async function loadDemo(): Promise<HospitalAlert[]> {
  const raw = await getItem(LS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((x) => ({
      ...x,
      createdAt: x.createdAt ? new Date(x.createdAt) : undefined,
      updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined,
    }));
  } catch { return []; }
}

async function saveDemo(list: HospitalAlert[]) {
  await setItem(LS_KEY, JSON.stringify(list));
}

function mapAlert(id: string, data: any): HospitalAlert {
  return {
    id,
    requestId: data.requestId,
    victimId: data.victimId,
    helperId: data.helperId,
    helperName: data.helperName,
    hospitalId: data.hospitalId,
    hospitalName: data.hospitalName,
    hospitalAddress: data.hospitalAddress,
    hospitalLocation: data.hospitalLocation,
    distanceFromSosKm: data.distanceFromSosKm,
    severity: data.severity,
    victimLocation: data.victimLocation,
    injuryNotes: data.injuryNotes,
    suggestedDept: data.suggestedDept,
    status: data.status ?? 'notified',
    createdAt: data.createdAt?.toDate?.() ?? (data.createdAt ? new Date(data.createdAt) : undefined),
    updatedAt: data.updatedAt?.toDate?.() ?? (data.updatedAt ? new Date(data.updatedAt) : undefined),
  };
}

export type NotifyHospitalInput = Omit<HospitalAlert, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export async function notifyHospital(input: NotifyHospitalInput): Promise<string> {
  if (isDemoMode) {
    const id = `demo-${Date.now()}`;
    const list = await loadDemo();
    list.unshift({ ...input, id, status: 'notified', createdAt: new Date(), updatedAt: new Date() });
    await saveDemo(list);
    return id;
  }

  const payload: Record<string, unknown> = {
    requestId: input.requestId,
    victimId: input.victimId,
    helperId: input.helperId,
    hospitalId: input.hospitalId,
    hospitalName: input.hospitalName,
    status: 'notified',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.helperName) payload.helperName = input.helperName;
  if (input.hospitalAddress) payload.hospitalAddress = input.hospitalAddress;
  if (input.hospitalLocation) payload.hospitalLocation = input.hospitalLocation;
  if (typeof input.distanceFromSosKm === 'number') payload.distanceFromSosKm = input.distanceFromSosKm;
  if (input.severity) payload.severity = input.severity;
  if (input.victimLocation) payload.victimLocation = input.victimLocation;
  if (input.injuryNotes) payload.injuryNotes = input.injuryNotes;
  if (input.suggestedDept) payload.suggestedDept = input.suggestedDept;

  const ref = await addDoc(collection(db, 'hospitalAlerts'), payload);
  return ref.id;
}

export async function updateHospitalAlert(id: string, patch: Partial<HospitalAlert>) {
  if (isDemoMode) {
    const list = await loadDemo();
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx]!, ...patch, updatedAt: new Date() };
      await saveDemo(list);
    }
    return;
  }
  const clean: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  delete clean.id;
  await updateDoc(doc(db, 'hospitalAlerts', id), clean);
}

export function listenAlertsForRequest(requestId: string, cb: (alerts: HospitalAlert[]) => void) {
  if (!requestId) { cb([]); return () => {}; }
  if (isDemoMode) {
    const tick = async () => {
      cb((await loadDemo()).filter((a) => a.requestId === requestId));
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }
  const q = query(
    collection(db, 'hospitalAlerts'),
    where('requestId', '==', requestId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => mapAlert(d.id, d.data())));
  });
}
