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
import { Client } from '../../types';

const CLIENTS_COLLECTION = 'clients';

export function subscribeClients(
  onUpdate: (clients: Client[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, CLIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((docSnap) => {
        clients.push({ id: docSnap.id, ...docSnap.data() } as Client);
      });
      // Sort by createdAt desc or name
      clients.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(clients);
    },
    (err) => {
      console.error('Firestore Clients snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

function sanitizeClientData(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      clean[key] = data[key];
    }
  });
  return clean;
}

export async function addClientFirestore(
  clientData: Omit<Client, 'id' | 'createdAt'>,
  customId?: string
): Promise<Client> {
  const id = customId || `CLI${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
  const createdAt = new Date().toISOString();
  
  const clientObj = sanitizeClientData({
    id,
    ...clientData,
    createdAt,
  }) as Client;

  await setDoc(doc(db, CLIENTS_COLLECTION, id), clientObj);
  return clientObj;
}

export async function updateClientFirestore(client: Client): Promise<void> {
  const docRef = doc(db, CLIENTS_COLLECTION, client.id);
  const cleanClient = sanitizeClientData(client);
  await setDoc(docRef, cleanClient, { merge: true });
}

export async function deleteClientFirestore(clientId: string): Promise<void> {
  await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId));
}
