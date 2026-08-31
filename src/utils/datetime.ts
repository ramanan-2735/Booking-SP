/**
 * Time and Collision Detection Utilities for Badminton Court Booking
 */

/**
 * Parses time strings such as "09:00 AM", "9:00 AM", "02:30 PM", "14:30"
 * into minutes from start of day (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();

  const isPM = str.includes('PM');
  const isAM = str.includes('AM');

  // Remove AM/PM
  const cleanStr = str.replace(/AM|PM/g, '').trim();
  const parts = cleanStr.split(':');
  
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Computes exact start and end epoch milliseconds and ISO strings for a booking.
 */
export function getBookingTimeRange(startDate: string, startTime: string, durationHours: number): {
  startMs: number;
  endMs: number;
  startIso: string;
  endIso: string;
} {
  const minutes = parseTimeToMinutes(startTime);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  // Create date in local representation
  const [year, month, day] = startDate.split('-').map(Number);
  const startDateObj = new Date(year, (month || 1) - 1, day || 1, hours, mins, 0, 0);

  const startMs = startDateObj.getTime();
  const endMs = startMs + Math.round(durationHours * 3600 * 1000);

  return {
    startMs,
    endMs,
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}

export interface BookingRangeInput {
  id?: string;
  courtId: string;
  startDate: string;
  startTime: string;
  durationHours: number;
  status: string;
  startAt?: string;
  endAt?: string;
}

/**
 * Determines whether two court bookings collide.
 *
 * Rules:
 * 1. Cancelled bookings never collide.
 * 2. Bookings on different courts never collide.
 * 3. Overlap exists IF max(start1, start2) < min(end1, end2).
 * 4. Adjacent slots (e.g. 10:00-11:00 and 11:00-12:00) DO NOT collide because 11 < 11 is false.
 */
export function doBookingsOverlap(
  bookingA: BookingRangeInput,
  bookingB: BookingRangeInput
): boolean {
  // If either booking is cancelled, no collision
  if (bookingA.status === 'Cancelled' || bookingB.status === 'Cancelled') {
    return false;
  }

  // If different courts, no collision
  if (!bookingA.courtId || !bookingB.courtId || bookingA.courtId !== bookingB.courtId) {
    return false;
  }

  // Calculate range A
  let rangeA: { startMs: number; endMs: number };
  if (bookingA.startAt && bookingA.endAt) {
    rangeA = {
      startMs: new Date(bookingA.startAt).getTime(),
      endMs: new Date(bookingA.endAt).getTime(),
    };
  } else {
    rangeA = getBookingTimeRange(bookingA.startDate, bookingA.startTime, bookingA.durationHours);
  }

  // Calculate range B
  let rangeB: { startMs: number; endMs: number };
  if (bookingB.startAt && bookingB.endAt) {
    rangeB = {
      startMs: new Date(bookingB.startAt).getTime(),
      endMs: new Date(bookingB.endAt).getTime(),
    };
  } else {
    rangeB = getBookingTimeRange(bookingB.startDate, bookingB.startTime, bookingB.durationHours);
  }

  // Overlap condition: max(startA, startB) < min(endA, endB)
  const maxStart = Math.max(rangeA.startMs, rangeB.startMs);
  const minEnd = Math.min(rangeA.endMs, rangeB.endMs);

  return maxStart < minEnd;
}

/**
 * Finds all overlapping bookings for a target booking against a list of existing bookings.
 */
export function findBookingCollisions(
  targetBooking: BookingRangeInput,
  existingBookings: BookingRangeInput[]
): BookingRangeInput[] {
  return existingBookings.filter((existing) => {
    // Ignore self when editing
    if (targetBooking.id && existing.id === targetBooking.id) {
      return false;
    }
    return doBookingsOverlap(targetBooking, existing);
  });
}
