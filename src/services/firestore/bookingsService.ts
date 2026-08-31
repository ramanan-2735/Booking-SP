import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Booking } from '../../types';
import { getBookingTimeRange, findBookingCollisions } from '../../utils/datetime';

const BOOKINGS_COLLECTION = 'bookings';

export function subscribeBookings(
  onUpdate: (bookings: Booking[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, BOOKINGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
      });
      bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(bookings);
    },
    (err) => {
      console.error('Firestore Bookings snapshot error:', err);
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

export async function addBookingFirestore(
  bookingData: Omit<Booking, 'id' | 'createdAt'>,
  existingBookings: Booking[],
  customId?: string
): Promise<{ booking?: Booking; error?: string }> {
  // Compute startAt and endAt ISO strings
  const range = getBookingTimeRange(
    bookingData.startDate,
    bookingData.startTime,
    bookingData.durationHours
  );

  const candidateBooking = sanitizeData({
    id: customId || `BK${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
    ...bookingData,
    courtId: bookingData.courtId || 'court-1',
    startAt: range.startIso,
    endAt: range.endIso,
    createdAt: new Date().toISOString(),
  }) as Booking;

  // Perform collision check
  const collisions = findBookingCollisions(candidateBooking, existingBookings);
  if (collisions.length > 0) {
    const existing = collisions[0] as Booking;
    return {
      error: `Court Collision: ${candidateBooking.courtName || 'Selected Court'} is already booked from ${existing.startTime} for ${existing.durationHours} hr(s) on ${existing.startDate}.`,
    };
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, candidateBooking.id);
    await setDoc(docRef, candidateBooking);
    return { booking: candidateBooking };
  } catch (err: any) {
    console.error('Error saving booking to Firestore:', err);
    return { error: err.message || 'Failed to save booking to Firestore' };
  }
}

export async function updateBookingFirestore(
  booking: Booking,
  existingBookings: Booking[]
): Promise<{ success: boolean; error?: string }> {
  const range = getBookingTimeRange(
    booking.startDate,
    booking.startTime,
    booking.durationHours
  );

  const updatedBooking = sanitizeData({
    ...booking,
    courtId: booking.courtId || 'court-1',
    startAt: range.startIso,
    endAt: range.endIso,
  }) as Booking;

  // Perform collision check
  const collisions = findBookingCollisions(updatedBooking, existingBookings);
  if (collisions.length > 0) {
    const existing = collisions[0] as Booking;
    return {
      success: false,
      error: `Court Collision: ${updatedBooking.courtName || 'Selected Court'} is already booked from ${existing.startTime} for ${existing.durationHours} hr(s) on ${existing.startDate}.`,
    };
  }

  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, updatedBooking.id);
    await setDoc(docRef, updatedBooking, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error updating booking in Firestore:', err);
    return { success: false, error: err.message || 'Failed to update booking' };
  }
}

export async function deleteBookingFirestore(bookingId: string): Promise<void> {
  await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
}
