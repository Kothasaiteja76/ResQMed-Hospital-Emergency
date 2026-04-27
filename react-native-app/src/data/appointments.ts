import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';

export type Appointment = {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  hospitalId: string;
  hospitalName: string;
  startAt: Date;
  slot: string;
  fee: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  paymentMethod?: string;
  paymentToken?: string;
};

const LS_KEY = 'resqmed_demo_appointments_v1';

async function loadDemo(): Promise<Appointment[]> {
  const raw = await getItem(LS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((x) => ({ ...x, startAt: new Date(x.startAt) }));
  } catch { return []; }
}

async function saveDemo(list: Appointment[]) {
  await setItem(LS_KEY, JSON.stringify(list));
}

export async function bookAppointment(input: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
  if (isDemoMode) {
    const id = `demo-${Date.now()}`;
    const appt: Appointment = { ...input, id, status: 'scheduled' };
    const list = await loadDemo();
    list.unshift(appt);
    await saveDemo(list);
    return appt;
  }

  const ref = await addDoc(collection(db, 'appointments'), {
    userId: input.userId,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    departmentId: input.departmentId,
    hospitalId: input.hospitalId,
    hospitalName: input.hospitalName,
    startAt: input.startAt,
    slot: input.slot,
    fee: input.fee,
    status: 'scheduled',
    paymentMethod: input.paymentMethod || null,
    paymentToken: input.paymentToken || null,
    createdAt: serverTimestamp(),
  });
  return { ...input, id: ref.id, status: 'scheduled' };
}

export function listenAppointments(userId: string, cb: (items: Appointment[]) => void) {
  if (isDemoMode) {
    const tick = async () => {
      const list = await loadDemo();
      cb(list.filter((a) => a.userId === userId));
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }

  const q = query(
    collection(db, 'appointments'),
    where('userId', '==', userId),
    orderBy('startAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        userId: data.userId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        departmentId: data.departmentId,
        hospitalId: data.hospitalId,
        hospitalName: data.hospitalName,
        startAt: data.startAt?.toDate?.() ?? new Date(),
        slot: data.slot,
        fee: data.fee,
        status: data.status,
        paymentMethod: data.paymentMethod,
      } as Appointment;
    }));
  });
}

export async function removeAppointment(id: string) {
  if (isDemoMode) {
    const list = await loadDemo();
    await saveDemo(list.filter((a) => a.id !== id));
    return;
  }
  await deleteDoc(doc(db, 'appointments', id));
}
