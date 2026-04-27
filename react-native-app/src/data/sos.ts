import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';

export type SosSeverity = 'minor' | 'major' | 'critical';
export type SosStatus = 'countdown' | 'active' | 'resolved' | 'cancelled' | 'expired';
export type IncidentType = 'crash' | 'fall' | 'medical' | 'other';

export type ParticipantBrief = {
  name?: string;
  age?: number;
  shortAddress?: string;
  phone?: string;
};

export type SosRequestDoc = {
  id: string;
  victimId: string;
  status: SosStatus;
  severity: SosSeverity;
  source: 'hardware' | 'mobile';
  countdown: number;
  location: { lat: number; lon: number } | null;
  hasValidLocation?: boolean;
  isApproximate?: boolean;
  radiusKm: number;
  primaryHelperId?: string;
  incidentType?: IncidentType;
  symptomNotes?: string;
  victimBrief?: ParticipantBrief;
  helpersAssigned?: string[];
  helpersAccepted?: string[];
};

export type SosAssignmentDoc = {
  id: string;
  requestId: string;
  victimId: string;
  helperId: string;
  status: 'accepted' | 'enroute' | 'reached' | 'secondary' | 'cancelled';
  lastLocation?: { lat: number; lon: number };
  distanceMeters?: number;
  distanceTrend?: 'closing' | 'stalled' | 'unknown';
  helperLocation?: { lat: number; lon: number; updatedAt?: number };
  etaSeconds?: number;
  routeEncoded?: string;
  lastRouteAt?: number;
  arrivedAt?: number;
  helperName?: string;
  helperBrief?: ParticipantBrief;
};

export async function getActiveSosForUser(victimId: string): Promise<SosRequestDoc | null> {
  if (isDemoMode) return null;
  const q = query(
    collection(db, 'sosRequests'),
    where('victimId', '==', victimId),
    where('status', '==', 'active'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  const data: any = d.data();
  return {
    id: d.id,
    victimId: data.victimId,
    status: data.status,
    severity: data.severity,
    source: data.source || 'mobile',
    countdown: data.countdown ?? 0,
    location: data.location ?? null,
    hasValidLocation: data.hasValidLocation ?? false,
    isApproximate: data.isApproximate ?? false,
    radiusKm: data.radiusKm ?? 5,
    primaryHelperId: data.primaryHelperId,
    incidentType: data.incidentType,
    symptomNotes: data.symptomNotes,
    victimBrief: data.victimBrief,
    helpersAssigned: data.helpersAssigned ?? [],
    helpersAccepted: data.helpersAccepted ?? [],
  };
}

export async function createSosRequest(input: Omit<SosRequestDoc, 'id' | 'primaryHelperId'>) {
  if (isDemoMode) return { ...input, id: `demo-${Date.now()}` } as SosRequestDoc;

  const existing = await getActiveSosForUser(input.victimId);
  if (existing) {
    console.warn('[SOS] Existing active SOS found — reusing:', existing.id);
    return existing;
  }

  const payload: Record<string, unknown> = {
    victimId: input.victimId,
    status: input.status,
    severity: input.severity,
    source: input.source || 'mobile',
    countdown: input.countdown ?? 0,
    location: input.location,
    hasValidLocation: input.hasValidLocation ?? false,
    isApproximate: input.isApproximate ?? false,
    radiusKm: input.radiusKm,
    helpersAssigned: [],
    helpersAccepted: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.incidentType) payload.incidentType = input.incidentType;
  if (input.symptomNotes) payload.symptomNotes = input.symptomNotes;
  if (input.victimBrief) payload.victimBrief = input.victimBrief;

  const ref = await addDoc(collection(db, 'sosRequests'), payload);
  return { ...input, id: ref.id } as SosRequestDoc;
}

export async function updateSosRequest(id: string, patch: Partial<SosRequestDoc>) {
  if (isDemoMode) return;
  const ref = doc(db, 'sosRequests', id);
  const clean: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  delete clean.id;
  await updateDoc(ref, clean);
}

export function listenSosRequestDoc(id: string, cb: (req: SosRequestDoc | null) => void) {
  if (!id) { cb(null); return () => {}; }
  if (isDemoMode) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, 'sosRequests', id),
    (snap) => {
      if (!snap.exists()) { cb(null); return; }
      const d: any = snap.data();
      cb({
        id: snap.id,
        victimId: d.victimId,
        status: d.status,
        severity: d.severity,
        source: d.source || 'mobile',
        countdown: d.countdown ?? 0,
        location: d.location ?? null,
        hasValidLocation: d.hasValidLocation ?? false,
        isApproximate: d.isApproximate ?? false,
        radiusKm: d.radiusKm ?? 5,
        primaryHelperId: d.primaryHelperId,
        incidentType: d.incidentType,
        symptomNotes: d.symptomNotes,
        victimBrief: d.victimBrief,
        helpersAssigned: d.helpersAssigned ?? [],
        helpersAccepted: d.helpersAccepted ?? [],
      });
    },
    () => cb(null),
  );
}

export function listenCurrentSosRequest(uid: string, cb: (req: SosRequestDoc | null) => void) {
  if (!uid) { cb(null); return () => {}; }
  if (isDemoMode) { cb(null); return () => {}; }
  const q = query(
    collection(db, 'sosRequests'),
    where('victimId', '==', uid),
    where('status', 'in', ['countdown', 'active']),
    limit(1),
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) { cb(null); return; }
    const d = snap.docs[0]!;
    const data: any = d.data();
    cb({
      id: d.id,
      victimId: data.victimId,
      status: data.status,
      severity: data.severity,
      source: data.source || 'mobile',
      countdown: data.countdown ?? 0,
      location: data.location ?? null,
      hasValidLocation: data.hasValidLocation ?? false,
      isApproximate: data.isApproximate ?? false,
      radiusKm: data.radiusKm ?? 5,
      primaryHelperId: data.primaryHelperId,
      incidentType: data.incidentType,
      symptomNotes: data.symptomNotes,
      victimBrief: data.victimBrief,
      helpersAssigned: data.helpersAssigned ?? [],
      helpersAccepted: data.helpersAccepted ?? [],
    });
  });
}

export function listenActiveSosRequests(cb: (requests: SosRequestDoc[]) => void) {
  if (isDemoMode) { cb([]); return () => {}; }
  const q = query(
    collection(db, 'sosRequests'),
    where('status', '==', 'active'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        victimId: data.victimId,
        status: data.status,
        severity: data.severity,
        source: data.source || 'mobile',
        countdown: data.countdown ?? 0,
        location: data.location ?? null,
        hasValidLocation: data.hasValidLocation ?? false,
        isApproximate: data.isApproximate ?? false,
        radiusKm: data.radiusKm ?? 5,
        primaryHelperId: data.primaryHelperId,
        incidentType: data.incidentType,
        symptomNotes: data.symptomNotes,
        victimBrief: data.victimBrief,
        helpersAssigned: data.helpersAssigned ?? [],
        helpersAccepted: data.helpersAccepted ?? [],
        _createdMs: data.createdAt?.toMillis?.() ?? Date.now(),
      } as SosRequestDoc & { _createdMs?: number };
    }));
  });
}

export async function acceptSosRequest(
  requestId: string,
  helperId: string,
  helperName?: string,
  helperBrief?: ParticipantBrief,
): Promise<string> {
  if (isDemoMode) return `demo-assign-${Date.now()}`;

  return await runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'sosRequests', requestId);
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists()) throw new Error('SOS request not found');
    const data: any = reqSnap.data();

    const accepted: string[] = data.helpersAccepted ?? [];
    if (accepted.includes(helperId)) throw new Error('Already accepted');
    if (accepted.length >= 1) throw new Error('Request already has a helper');

    tx.update(reqRef, {
      helpersAccepted: arrayUnion(helperId),
      primaryHelperId: helperId,
      updatedAt: serverTimestamp(),
    });

    const assignRef = doc(collection(db, 'sosAssignments'));
    const assignData: Record<string, unknown> = {
      requestId,
      victimId: data.victimId,
      helperId,
      status: 'accepted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (helperName) assignData.helperName = helperName;
    if (helperBrief) assignData.helperBrief = helperBrief;
    tx.set(assignRef, assignData);

    return assignRef.id;
  });
}

export async function removeHelperFromSos(requestId: string, helperId: string, assignmentId?: string) {
  if (isDemoMode) return;
  await updateDoc(doc(db, 'sosRequests', requestId), {
    helpersAccepted: arrayRemove(helperId),
    updatedAt: serverTimestamp(),
  });
  if (assignmentId) {
    await updateDoc(doc(db, 'sosAssignments', assignmentId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  }
}

export async function updateAssignment(id: string, patch: Partial<SosAssignmentDoc>) {
  if (isDemoMode) return;
  const clean: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  delete clean.id;
  await updateDoc(doc(db, 'sosAssignments', id), clean);
}

export function listenAssignmentsForRequest(requestId: string, cb: (items: SosAssignmentDoc[]) => void) {
  if (!requestId) { cb([]); return () => {}; }
  if (isDemoMode) { cb([]); return () => {}; }
  const q = query(collection(db, 'sosAssignments'), where('requestId', '==', requestId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        requestId: data.requestId,
        victimId: data.victimId,
        helperId: data.helperId,
        status: data.status,
        lastLocation: data.lastLocation,
        distanceMeters: data.distanceMeters,
        distanceTrend: data.distanceTrend,
        helperLocation: data.helperLocation,
        etaSeconds: data.etaSeconds,
        routeEncoded: data.routeEncoded,
        lastRouteAt: data.lastRouteAt,
        arrivedAt: data.arrivedAt,
        helperName: data.helperName,
        helperBrief: data.helperBrief,
      };
    }));
  });
}

export function listenMyAssignment(
  requestId: string,
  helperId: string,
  cb: (a: SosAssignmentDoc | null) => void,
) {
  if (!requestId || !helperId) { cb(null); return () => {}; }
  if (isDemoMode) { cb(null); return () => {}; }
  const q = query(
    collection(db, 'sosAssignments'),
    where('requestId', '==', requestId),
    where('helperId', '==', helperId),
    limit(1),
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) { cb(null); return; }
    const d = snap.docs[0]!;
    const data: any = d.data();
    cb({
      id: d.id,
      requestId: data.requestId,
      victimId: data.victimId,
      helperId: data.helperId,
      status: data.status,
      helperLocation: data.helperLocation,
      etaSeconds: data.etaSeconds,
      routeEncoded: data.routeEncoded,
      lastRouteAt: data.lastRouteAt,
      arrivedAt: data.arrivedAt,
      helperName: data.helperName,
      helperBrief: data.helperBrief,
      distanceMeters: data.distanceMeters,
    });
  });
}
