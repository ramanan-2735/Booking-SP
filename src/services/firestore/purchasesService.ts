import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SessionPurchase } from '../../types';

const PURCHASES_COLLECTION = 'purchases';

export function subscribePurchases(
  onUpdate: (purchases: SessionPurchase[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, PURCHASES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const purchases: SessionPurchase[] = [];
      snapshot.forEach((docSnap) => {
        purchases.push({ id: docSnap.id, ...docSnap.data() } as SessionPurchase);
      });
      purchases.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(purchases);
    },
    (err) => {
      console.error('Firestore Purchases snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

function sanitizeData(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      clean[key] = data[key];
    }
  });
  return clean;
}

export async function addPurchaseFirestore(
  purchaseData: Omit<SessionPurchase, 'id' | 'createdAt'>,
  customId?: string
): Promise<SessionPurchase> {
  const id = customId || `Pur${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
  const createdAt = new Date().toISOString();

  const purchase = sanitizeData({
    id,
    ...purchaseData,
    createdAt,
  }) as SessionPurchase;

  await setDoc(doc(db, PURCHASES_COLLECTION, id), purchase);
  return purchase;
}

export async function updatePurchaseFirestore(purchase: SessionPurchase): Promise<void> {
  const docRef = doc(db, PURCHASES_COLLECTION, purchase.id);
  const cleanObj = sanitizeData(purchase);
  await setDoc(docRef, cleanObj, { merge: true });
}

export async function deletePurchaseFirestore(purchaseId: string): Promise<void> {
  await deleteDoc(doc(db, PURCHASES_COLLECTION, purchaseId));
}
