import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Court, DEFAULT_COURTS } from '../../types';

const COURTS_COLLECTION = 'courts';

export function subscribeCourts(
  onUpdate: (courts: Court[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COURTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default courts if collection is empty
        seedDefaultCourts().catch((err) => console.error('Failed to seed default courts:', err));
        onUpdate(DEFAULT_COURTS);
        return;
      }
      const courts: Court[] = [];
      snapshot.forEach((docSnap) => {
        courts.push({ id: docSnap.id, ...docSnap.data() } as Court);
      });
      // Sort courts by number
      courts.sort((a, b) => (a.number || 0) - (b.number || 0));
      onUpdate(courts);
    },
    (err) => {
      console.error('Firestore Courts snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

export async function seedDefaultCourts(): Promise<void> {
  const colRef = collection(db, COURTS_COLLECTION);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    for (const court of DEFAULT_COURTS) {
      await setDoc(doc(db, COURTS_COLLECTION, court.id), {
        name: court.name,
        number: court.number,
        isActive: court.isActive,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

export async function saveCourt(court: Court): Promise<void> {
  const docRef = doc(db, COURTS_COLLECTION, court.id);
  await setDoc(docRef, {
    name: court.name,
    number: court.number,
    isActive: court.isActive,
    createdAt: court.createdAt || new Date().toISOString(),
  }, { merge: true });
}
