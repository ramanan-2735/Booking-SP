import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Client, SessionPurchase, Booking } from '../../types';
import { addClientFirestore } from './clientsService';
import { addPurchaseFirestore } from './purchasesService';
import { addBookingFirestore } from './bookingsService';

const MIGRATION_DOC = doc(db, 'settings', 'migration');

const STORAGE_KEYS = {
  CLIENTS: 'csb_clients_v1',
  PURCHASES: 'csb_purchases_v1',
  BOOKINGS: 'csb_bookings_v1',
};

export async function checkAndRunLocalStorageMigration(): Promise<{
  migrated: boolean;
  clientCount: number;
  purchaseCount: number;
  bookingCount: number;
}> {
  try {
    // Check if migration has already been executed
    const migrationSnap = await getDoc(MIGRATION_DOC);
    if (migrationSnap.exists() && migrationSnap.data()?.migration_v1_complete) {
      return { migrated: false, clientCount: 0, purchaseCount: 0, bookingCount: 0 };
    }

    // Read existing localStorage data
    const rawClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const rawPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    const rawBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);

    const clients: Client[] = rawClients ? JSON.parse(rawClients) : [];
    const purchases: SessionPurchase[] = rawPurchases ? JSON.parse(rawPurchases) : [];
    const bookings: Booking[] = rawBookings ? JSON.parse(rawBookings) : [];

    if (clients.length === 0 && purchases.length === 0 && bookings.length === 0) {
      // Nothing to migrate, mark complete
      await setDoc(MIGRATION_DOC, { migration_v1_complete: true, timestamp: new Date().toISOString() });
      return { migrated: false, clientCount: 0, purchaseCount: 0, bookingCount: 0 };
    }

    console.log(`Starting LocalStorage to Firestore migration: ${clients.length} clients, ${purchases.length} purchases, ${bookings.length} bookings...`);

    // Migrate Clients
    for (const c of clients) {
      await addClientFirestore(
        {
          name: c.name,
          phone: c.phone,
          email: c.email,
          firstBookingDate: c.firstBookingDate,
          notes: c.notes,
        },
        c.id
      );
    }

    // Migrate Purchases
    for (const p of purchases) {
      await addPurchaseFirestore(
        {
          clientId: p.clientId,
          clientName: p.clientName,
          purchaseDate: p.purchaseDate,
          hoursPurchased: p.hoursPurchased,
          ratePerHour: p.ratePerHour,
          totalAmount: p.totalAmount,
          paymentStatus: p.paymentStatus,
          notes: p.notes,
        },
        p.id
      );
    }

    // Migrate Bookings (safely assign default courtId if missing)
    for (const b of bookings) {
      await addBookingFirestore(
        {
          clientId: b.clientId,
          clientName: b.clientName,
          purchaseId: b.purchaseId,
          courtId: b.courtId || 'court-1',
          courtName: b.courtName || 'Court 1',
          startDate: b.startDate,
          startTime: b.startTime,
          durationHours: b.durationHours,
          status: b.status,
          notes: b.notes,
          googleEventId: b.googleEventId,
          googleCalendarHtmlLink: b.googleCalendarHtmlLink,
          googleCalendarId: b.googleCalendarId,
        },
        [], // Bypass collision check during migration
        b.id
      );
    }

    // Mark migration as complete
    await setDoc(MIGRATION_DOC, {
      migration_v1_complete: true,
      timestamp: new Date().toISOString(),
      migratedClients: clients.length,
      migratedPurchases: purchases.length,
      migratedBookings: bookings.length,
    });

    console.log('Migration to Firestore successfully completed!');
    return {
      migrated: true,
      clientCount: clients.length,
      purchaseCount: purchases.length,
      bookingCount: bookings.length,
    };
  } catch (err) {
    console.error('Data migration error:', err);
    return { migrated: false, clientCount: 0, purchaseCount: 0, bookingCount: 0 };
  }
}
