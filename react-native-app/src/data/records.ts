import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';

export type RecordType = 'Prescription' | 'LabReport' | 'XRay' | 'Imaging' | 'Consultation';

export type MedicalRecord = {
  id: string;
  patientId: string;
  type: RecordType;
  title: string;
  notes?: string;
  recordDate: Date;
  files: Array<{ path: string; name: string; url?: string }>;
};

const LS_KEY = 'resqmed_demo_records_v1';

async function loadDemo(): Promise<MedicalRecord[]> {
  const raw = await getItem(LS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((x) => ({ ...x, recordDate: new Date(x.recordDate) }));
  } catch { return []; }
}

async function saveDemo(list: MedicalRecord[]) {
  await setItem(LS_KEY, JSON.stringify(list));
}

export async function listRecords(patientId: string): Promise<MedicalRecord[]> {
  if (isDemoMode) {
    return (await loadDemo()).filter((r) => r.patientId === patientId);
  }
  const q = query(collection(db, 'medicalRecords'), where('patientId', '==', patientId), orderBy('recordDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      patientId: data.patientId,
      type: data.type,
      title: data.title,
      notes: data.notes,
      recordDate: data.recordDate?.toDate?.() ?? new Date(),
      files: (data.files ?? []).map((f: any) => ({ path: f.path, name: f.name })),
    };
  });
}

export function listenRecords(patientId: string, cb: (items: MedicalRecord[]) => void) {
  if (isDemoMode) {
    const tick = async () => cb((await loadDemo()).filter((r) => r.patientId === patientId));
    tick();
    const t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }
  const q = query(collection(db, 'medicalRecords'), where('patientId', '==', patientId), orderBy('recordDate', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        patientId: data.patientId,
        type: data.type,
        title: data.title,
        notes: data.notes,
        recordDate: data.recordDate?.toDate?.() ?? new Date(),
        files: (data.files ?? []).map((f: any) => ({ path: f.path, name: f.name })),
      } satisfies MedicalRecord;
    }));
  });
}

export async function createRecord(input: {
  patientId: string;
  type: RecordType;
  title: string;
  notes?: string;
  recordDate: Date;
  fileUris: { uri: string; name: string }[];
}): Promise<MedicalRecord> {
  if (isDemoMode) {
    const id = `demo-${Date.now()}`;
    const demo: MedicalRecord = {
      id,
      patientId: input.patientId,
      type: input.type,
      title: input.title,
      notes: input.notes,
      recordDate: input.recordDate,
      files: input.fileUris.map((f) => ({ path: `demo://${id}/${f.name}`, name: f.name })),
    };
    const all = await loadDemo();
    await saveDemo([demo, ...all]);
    return demo;
  }

  const docRef = await addDoc(collection(db, 'medicalRecords'), {
    patientId: input.patientId,
    type: input.type,
    title: input.title,
    notes: input.notes ?? '',
    recordDate: input.recordDate,
    files: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const uploaded: Array<{ path: string; name: string; url?: string }> = [];
  for (const f of input.fileUris) {
    const path = `medical-records/${input.patientId}/${docRef.id}/${f.name}`;
    const fileRef = ref(storage, path);
    const response = await fetch(f.uri);
    const blob = await response.blob();
    await uploadBytes(fileRef, blob);
    uploaded.push({ path, name: f.name });
  }

  await updateDoc(doc(db, 'medicalRecords', docRef.id), {
    files: uploaded.map((f) => ({ path: f.path, name: f.name })),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    patientId: input.patientId,
    type: input.type,
    title: input.title,
    notes: input.notes,
    recordDate: input.recordDate,
    files: uploaded,
  };
}

export async function resolveFileUrls(record: MedicalRecord): Promise<MedicalRecord> {
  if (isDemoMode) return record;
  const filesWithUrls = await Promise.all(
    record.files.map(async (f) => {
      const url = await getDownloadURL(ref(storage, f.path));
      return { ...f, url };
    }),
  );
  return { ...record, files: filesWithUrls };
}
