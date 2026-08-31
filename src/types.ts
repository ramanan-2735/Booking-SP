export interface Client {
  id: string; // e.g. "CLI0001"
  name: string;
  phone?: string;
  email?: string;
  firstBookingDate?: string; // e.g. "2026-07-12" or "12/7/2026"
  notes?: string;
  createdAt: string;
}

export interface SessionPurchase {
  id: string; // e.g. "Pur0001"
  clientId: string; // e.g. "CLI0001"
  clientName: string;
  purchaseDate: string; // e.g. "2026-07-01"
  hoursPurchased: number; // e.g. 20
  ratePerHour?: number;
  totalAmount?: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
  notes?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
  createdAt?: string;
}

export const DEFAULT_COURTS: Court[] = [
  { id: 'court-1', name: 'Court 1', number: 1, isActive: true },
  { id: 'court-2', name: 'Court 2', number: 2, isActive: true },
  { id: 'court-3', name: 'Court 3', number: 3, isActive: true },
  { id: 'court-4', name: 'Court 4', number: 4, isActive: true },
  { id: 'court-5', name: 'Court 5', number: 5, isActive: true },
  { id: 'court-6', name: 'Court 6', number: 6, isActive: true },
];

export type BookingStatus = 'Scheduled' | 'Completed' | 'In Progress' | 'Cancelled';

export interface Booking {
  id: string; // e.g. "BK0001"
  clientId: string; // e.g. "CLI0001"
  clientName: string;
  purchaseId?: string; // linked purchase if specific, or general balance
  courtId: string; // e.g. "court-1"
  courtName?: string; // cached name e.g. "Court 1"
  startDate: string; // e.g. "2026-07-13"
  startTime: string; // e.g. "09:00 AM" or "09:00"
  durationHours: number; // slots used (e.g. 1, 2, 4)
  startAt?: string; // ISO string calculated for collision checking
  endAt?: string; // ISO string calculated for collision checking
  status: BookingStatus;
  notes?: string;
  googleEventId?: string;
  googleCalendarHtmlLink?: string;
  googleCalendarId?: string;
  createdAt: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
}

export interface ClientStats {
  client: Client;
  totalHoursPurchased: number;
  totalSlotsUsed: number;
  hoursRemaining: number;
  firstBookingDate: string;
  purchaseCount: number;
  bookingCount: number;
  relatedPurchases: SessionPurchase[];
  relatedBookings: Booking[];
}

export interface PurchaseStats {
  purchase: SessionPurchase;
  slotsUsed: number;
  hoursRemaining: number;
  relatedBookings: Booking[];
}

export type ActiveTab = 'master' | 'purchases' | 'bookings' | 'calendar';

export type ActiveView = 
  | { type: 'list' }
  | { type: 'client-detail'; clientId: string }
  | { type: 'purchase-detail'; purchaseId: string }
  | { type: 'booking-detail'; bookingId: string };
