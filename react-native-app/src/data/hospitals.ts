import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { isDemoMode } from '../app/env';
import { getItem, setItem } from '../lib/storage';

export type Department = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  gradient: [string, string];
};

export const DEPARTMENTS: Department[] = [
  { id: 'general', name: 'General Medicine', tagline: 'Primary care & diagnostics', icon: '🩺', gradient: ['#10b981', '#0891b2'] },
  { id: 'cardio', name: 'Cardiology', tagline: 'Heart & vascular care', icon: '❤️', gradient: ['#ef4444', '#dc2626'] },
  { id: 'ortho', name: 'Orthopedics', tagline: 'Bones, joints & muscles', icon: '🦴', gradient: ['#f59e0b', '#d97706'] },
  { id: 'neuro', name: 'Neurology', tagline: 'Brain & nervous system', icon: '🧠', gradient: ['#8b5cf6', '#6d28d9'] },
  { id: 'pedia', name: 'Pediatrics', tagline: 'Child & adolescent health', icon: '👶', gradient: ['#ec4899', '#db2777'] },
  { id: 'derm', name: 'Dermatology', tagline: 'Skin, hair & nails', icon: '🧴', gradient: ['#14b8a6', '#0d9488'] },
  { id: 'ent', name: 'ENT', tagline: 'Ear, nose & throat', icon: '👂', gradient: ['#6366f1', '#4f46e5'] },
  { id: 'ophthal', name: 'Ophthalmology', tagline: 'Eye care & vision', icon: '👁️', gradient: ['#3b82f6', '#2563eb'] },
  { id: 'dental', name: 'Dental', tagline: 'Teeth, gum & oral care', icon: '🦷', gradient: ['#06b6d4', '#0891b2'] },
  { id: 'gynae', name: 'Gynecology', tagline: "Women's health", icon: '🌸', gradient: ['#f472b6', '#ec4899'] },
  { id: 'uro', name: 'Urology', tagline: 'Urinary tract & kidney', icon: '🫘', gradient: ['#a855f7', '#7c3aed'] },
  { id: 'psych', name: 'Psychiatry', tagline: 'Mental health & counseling', icon: '🧘', gradient: ['#22d3ee', '#06b6d4'] },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export type DoctorSlot = {
  time: string;
  label: string;
  available: boolean;
};

export type Doctor = {
  id: string;
  name: string;
  speciality: string;
  departmentId: string;
  experience: string;
  rating: number;
  fee: number;
  nextSlot?: string;
  slots?: DoctorSlot[];
  avatar?: string;
};

export type Hospital = {
  id: string;
  name: string;
  address: string;
  tagline: string;
  rating: number;
  departments: string[];
  location?: { lat: number; lon: number };
  doctors: Doctor[];
  isShowcase?: boolean;
};

export const SHOWCASE_HOSPITAL: Hospital = {
  id: 'arogya-medicare',
  name: 'Arogya Medicare Hospital',
  address: 'Sector 12, Dwarka, New Delhi',
  tagline: 'Multi-speciality · 200+ beds',
  rating: 4.7,
  isShowcase: true,
  departments: DEPARTMENTS.map((d) => d.id),
  location: { lat: 28.5918, lon: 77.0411 },
  doctors: [
    { id: 'doc-1', name: 'Dr. Meera Sharma', speciality: 'Cardiologist', departmentId: 'cardio', experience: '18 yrs', rating: 4.9, fee: 800, nextSlot: '10:30 AM', avatar: '' },
    { id: 'doc-2', name: 'Dr. Arjun Rao', speciality: 'Orthopedic Surgeon', departmentId: 'ortho', experience: '14 yrs', rating: 4.8, fee: 700, nextSlot: '11:00 AM', avatar: '' },
    { id: 'doc-3', name: 'Dr. Priya Nair', speciality: 'General Physician', departmentId: 'general', experience: '10 yrs', rating: 4.7, fee: 500, nextSlot: '9:30 AM', avatar: '' },
    { id: 'doc-4', name: 'Dr. Rohit Malhotra', speciality: 'Neurologist', departmentId: 'neuro', experience: '20 yrs', rating: 4.9, fee: 1200, nextSlot: '2:00 PM', avatar: '' },
    { id: 'doc-5', name: 'Dr. Sneha Kapoor', speciality: 'Dermatologist', departmentId: 'derm', experience: '8 yrs', rating: 4.6, fee: 600, nextSlot: '3:30 PM', avatar: '' },
    { id: 'doc-6', name: 'Dr. Vikram Singh', speciality: 'Pediatrician', departmentId: 'pedia', experience: '12 yrs', rating: 4.8, fee: 600, nextSlot: '10:00 AM', avatar: '' },
    { id: 'doc-7', name: 'Dr. Anita Desai', speciality: 'ENT Specialist', departmentId: 'ent', experience: '15 yrs', rating: 4.7, fee: 700, nextSlot: '11:30 AM', avatar: '' },
    { id: 'doc-8', name: 'Dr. Rajesh Kumar', speciality: 'Ophthalmologist', departmentId: 'ophthal', experience: '16 yrs', rating: 4.8, fee: 750, nextSlot: '1:00 PM', avatar: '' },
    { id: 'doc-9', name: 'Dr. Kavya Menon', speciality: 'Dentist', departmentId: 'dental', experience: '9 yrs', rating: 4.6, fee: 500, nextSlot: '4:00 PM', avatar: '' },
    { id: 'doc-10', name: 'Dr. Sunita Joshi', speciality: 'Gynecologist', departmentId: 'gynae', experience: '22 yrs', rating: 4.9, fee: 900, nextSlot: '9:00 AM', avatar: '' },
    { id: 'doc-11', name: 'Dr. Manish Verma', speciality: 'Urologist', departmentId: 'uro', experience: '11 yrs', rating: 4.7, fee: 850, nextSlot: '2:30 PM', avatar: '' },
    { id: 'doc-12', name: 'Dr. Neha Gupta', speciality: 'Psychiatrist', departmentId: 'psych', experience: '13 yrs', rating: 4.8, fee: 1000, nextSlot: '12:00 PM', avatar: '' },
  ],
};

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export async function searchNearbyHospitals(lat: number, lon: number, radiusKm = 5): Promise<Hospital[]> {
  if (!GOOGLE_PLACES_KEY) return [SHOWCASE_HOSPITAL];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusKm * 1000}&type=hospital&key=${GOOGLE_PLACES_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results ?? [];
    const hospitals: Hospital[] = results.slice(0, 8).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity ?? '',
      tagline: 'Nearby hospital',
      rating: place.rating ?? 0,
      departments: ['general'],
      location: place.geometry?.location ? { lat: place.geometry.location.lat, lon: place.geometry.location.lng } : undefined,
      doctors: [],
    }));
    return [SHOWCASE_HOSPITAL, ...hospitals];
  } catch (e) {
    console.warn('searchNearbyHospitals failed:', e);
    return [SHOWCASE_HOSPITAL];
  }
}

export function listenHospitals(cb: (list: Hospital[]) => void) {
  if (isDemoMode) {
    cb([SHOWCASE_HOSPITAL]);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'hospitals'),
    (snap) => {
      const list = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          name: data.name,
          address: data.address,
          tagline: data.tagline ?? '',
          rating: data.rating ?? 0,
          departments: data.departments ?? [],
          location: data.location,
          doctors: data.doctors ?? [],
          isShowcase: data.isShowcase ?? false,
        } as Hospital;
      });
      if (!list.find((h) => h.id === 'arogya-medicare')) list.unshift(SHOWCASE_HOSPITAL);
      cb(list);
    },
  );
}
