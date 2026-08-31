import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Client,
  SessionPurchase,
  Booking,
  Court,
  ClientStats,
  PurchaseStats,
  GoogleCalendarItem,
  GoogleCalendarEvent,
} from '../types';
import { subscribeClients, addClientFirestore, updateClientFirestore, deleteClientFirestore } from '../services/firestore/clientsService';
import { subscribePurchases, addPurchaseFirestore, updatePurchaseFirestore, deletePurchaseFirestore } from '../services/firestore/purchasesService';
import { subscribeBookings, addBookingFirestore, updateBookingFirestore, deleteBookingFirestore } from '../services/firestore/bookingsService';
import { subscribeCourts } from '../services/firestore/courtsService';
import { checkAndRunLocalStorageMigration } from '../services/firestore/migrationService';

import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

import {
  listUserSpreadsheets,
  createNewSpreadsheetWithData,
  exportAllDataToSpreadsheet,
  importDataFromSpreadsheet,
  DriveSpreadsheet,
} from '../services/googleSheets';
import {
  listUserCalendars,
  getCalendarEvents,
  createCalendarEventForBooking,
  updateCalendarEventForBooking,
  deleteCalendarEvent,
} from '../services/googleCalendar';
import { getAccessToken } from '../services/googleAuth';

interface DataContextType {
  clients: Client[];
  purchases: SessionPurchase[];
  bookings: Booking[];
  courts: Court[];

  // Google Sheets state
  isSheetsSyncing: boolean;
  connectedSpreadsheetId: string | null;
  connectedSpreadsheetName: string | null;
  connectedSpreadsheetUrl: string | null;
  lastSheetsSyncTime: string | null;

  // Google Calendar state
  isCalendarSyncing: boolean;
  isCalendarLoading: boolean;
  selectedCalendarId: string;
  selectedCalendarName: string;
  userCalendars: GoogleCalendarItem[];
  calendarEvents: GoogleCalendarEvent[];
  lastCalendarSyncTime: string | null;
  autoSyncCalendar: boolean;

  // Actions
  getClientStats: (clientId: string) => ClientStats | null;
  getPurchaseStats: (purchaseId: string) => PurchaseStats | null;

  // Client CRUD
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;

  // Purchase CRUD
  addPurchase: (purchaseData: Omit<SessionPurchase, 'id' | 'createdAt'>) => Promise<SessionPurchase>;
  updatePurchase: (purchase: SessionPurchase) => Promise<void>;
  deletePurchase: (purchaseId: string) => Promise<void>;

  // Booking CRUD
  addBooking: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => Promise<{ booking?: Booking; error?: string }>;
  updateBooking: (booking: Booking) => Promise<{ success: boolean; error?: string }>;
  deleteBooking: (bookingId: string) => Promise<void>;

  confirmDelete: () => Promise<void>;

  // Google Sheets Actions
  connectSpreadsheet: (sheet: DriveSpreadsheet) => void;
  disconnectSpreadsheet: () => void;
  exportToNewGoogleSheet: (customTitle?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  syncToConnectedSheet: () => Promise<{ success: boolean; error?: string }>;
  importFromConnectedSheet: (customSpreadsheetId?: string) => Promise<{ success: boolean; error?: string }>;
  fetchDriveSpreadsheets: () => Promise<DriveSpreadsheet[]>;

  // Google Calendar Actions
  setSelectedCalendarId: (id: string, name?: string) => void;
  setAutoSyncCalendar: (enabled: boolean) => void;
  fetchUserCalendars: () => Promise<GoogleCalendarItem[]>;
  fetchCalendarEvents: (timeMin?: string, timeMax?: string) => Promise<GoogleCalendarEvent[]>;
  syncBookingToGoogleCalendar: (bookingId: string) => Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }>;
  deleteBookingFromGoogleCalendar: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  syncAllBookingsToGoogleCalendar: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;
  importEventsAsBookings: (events: GoogleCalendarEvent[]) => Promise<{ success: boolean; importedCount: number; error?: string }>;
  resetToSampleData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonData: string) => boolean;
}

const STORAGE_KEYS = {
  SHEET_ID: 'csb_sheet_id_v1',
  SHEET_NAME: 'csb_sheet_name_v1',
  SHEET_URL: 'csb_sheet_url_v1',
  SHEET_SYNC_TIME: 'csb_sheet_sync_time_v1',
  CALENDAR_ID: 'csb_cal_id_v1',
  CALENDAR_NAME: 'csb_cal_name_v1',
  CALENDAR_SYNC_TIME: 'csb_cal_sync_time_v1',
  AUTO_SYNC_CAL: 'csb_auto_sync_cal_v1',
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { googleUser } = useAuth();
  const { addToast, deleteModalTarget, closeDeleteModal } = useUI();

  const [clients, setClients] = useState<Client[]>([]);
  const [purchases, setPurchases] = useState<SessionPurchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  // Sheets state
  const [isSheetsSyncing, setIsSheetsSyncing] = useState(false);
  const [connectedSpreadsheetId, setConnectedSpreadsheetId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SHEET_ID) || null);
  const [connectedSpreadsheetName, setConnectedSpreadsheetName] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SHEET_NAME) || null);
  const [connectedSpreadsheetUrl, setConnectedSpreadsheetUrl] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SHEET_URL) || null);
  const [lastSheetsSyncTime, setLastSheetsSyncTime] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.SHEET_SYNC_TIME) || null);

  // Calendar state
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.CALENDAR_ID) || 'primary');
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.CALENDAR_NAME) || 'Primary Calendar');
  const [userCalendars, setUserCalendars] = useState<GoogleCalendarItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [lastCalendarSyncTime, setLastCalendarSyncTime] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.CALENDAR_SYNC_TIME) || null);
  const [autoSyncCalendar, setAutoSyncCalendarState] = useState<boolean>(() => localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_CAL) === 'true');

  // Check migration and subscribe to Firestore real-time snapshots
  useEffect(() => {
    checkAndRunLocalStorageMigration()
      .then((res) => {
        if (res.migrated) {
          addToast('success', `Migrated ${res.clientCount} clients, ${res.purchaseCount} passes, ${res.bookingCount} bookings to Cloud Firestore.`);
        }
      })
      .catch((err) => console.error('Migration error:', err));

    const unsubClients = subscribeClients((data) => setClients(data));
    const unsubPurchases = subscribePurchases((data) => setPurchases(data));
    const unsubBookings = subscribeBookings((data) => setBookings(data));
    const unsubCourts = subscribeCourts((data) => setCourts(data));

    return () => {
      unsubClients();
      unsubPurchases();
      unsubBookings();
      unsubCourts();
    };
  }, []);

  // Stats Helper: Client
  const getClientStats = (clientId: string): ClientStats | null => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    const relatedPurchases = purchases.filter((p) => p.clientId === clientId);
    const relatedBookings = bookings.filter((b) => b.clientId === clientId);

    const totalHoursPurchased = relatedPurchases.reduce((acc, p) => acc + (p.hoursPurchased || 0), 0);
    const totalSlotsUsed = relatedBookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((acc, b) => acc + (b.durationHours || 0), 0);

    const hoursRemaining = Math.max(0, totalHoursPurchased - totalSlotsUsed);

    const sortedBookings = [...relatedBookings].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const firstBookingDate = sortedBookings.length > 0 ? sortedBookings[0].startDate : client.firstBookingDate || '-';

    return {
      client,
      totalHoursPurchased,
      totalSlotsUsed,
      hoursRemaining,
      firstBookingDate,
      purchaseCount: relatedPurchases.length,
      bookingCount: relatedBookings.length,
      relatedPurchases,
      relatedBookings,
    };
  };

  // Stats Helper: Purchase
  const getPurchaseStats = (purchaseId: string): PurchaseStats | null => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return null;

    const relatedBookings = bookings.filter(
      (b) => b.purchaseId === purchaseId && b.status !== 'Cancelled'
    );
    const slotsUsed = relatedBookings.reduce((acc, b) => acc + (b.durationHours || 0), 0);
    const hoursRemaining = Math.max(0, (purchase.hoursPurchased || 0) - slotsUsed);

    return {
      purchase,
      slotsUsed,
      hoursRemaining,
      relatedBookings,
    };
  };

  // CRUD Actions
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const newClient = await addClientFirestore(clientData);
    addToast('success', `Client "${newClient.name}" added successfully.`);
    return newClient;
  };

  const updateClient = async (client: Client): Promise<void> => {
    await updateClientFirestore(client);
    addToast('info', `Client "${client.name}" updated.`);
  };

  const deleteClient = async (clientId: string): Promise<void> => {
    const target = clients.find((c) => c.id === clientId);
    await deleteClientFirestore(clientId);
    addToast('warning', `Client "${target?.name || clientId}" removed.`);
  };

  const addPurchase = async (purchaseData: Omit<SessionPurchase, 'id' | 'createdAt'>): Promise<SessionPurchase> => {
    const client = clients.find((c) => c.id === purchaseData.clientId);
    const clientName = client ? client.name : purchaseData.clientName || 'Unknown Client';

    const newPurchase = await addPurchaseFirestore({
      ...purchaseData,
      clientName,
    });
    addToast('success', `Added ${newPurchase.hoursPurchased} hrs purchase for ${clientName}.`);
    return newPurchase;
  };

  const updatePurchase = async (purchase: SessionPurchase): Promise<void> => {
    await updatePurchaseFirestore(purchase);
    addToast('info', `Purchase "${purchase.id}" updated.`);
  };

  const deletePurchase = async (purchaseId: string): Promise<void> => {
    await deletePurchaseFirestore(purchaseId);
    addToast('warning', `Purchase record removed.`);
  };

  const addBooking = async (
    bookingData: Omit<Booking, 'id' | 'createdAt'>
  ): Promise<{ booking?: Booking; error?: string }> => {
    const client = clients.find((c) => c.id === bookingData.clientId);
    const clientName = client ? client.name : bookingData.clientName || 'Client';
    const court = courts.find((c) => c.id === bookingData.courtId);
    const courtName = court ? court.name : bookingData.courtName || 'Court 1';

    const res = await addBookingFirestore(
      {
        ...bookingData,
        clientName,
        courtName,
      },
      bookings
    );

    if (res.error) {
      addToast('error', res.error);
      return { error: res.error };
    }

    addToast('success', `Booking confirmed for ${clientName} on ${courtName} at ${bookingData.startTime}.`);
    return { booking: res.booking };
  };

  const updateBooking = async (booking: Booking): Promise<{ success: boolean; error?: string }> => {
    const court = courts.find((c) => c.id === booking.courtId);
    const courtName = court ? court.name : booking.courtName || 'Court 1';

    const res = await updateBookingFirestore(
      {
        ...booking,
        courtName,
      },
      bookings
    );

    if (res.error) {
      addToast('error', res.error);
      return { success: false, error: res.error };
    }

    addToast('info', `Booking updated.`);
    return { success: true };
  };

  const deleteBooking = async (bookingId: string): Promise<void> => {
    await deleteBookingFirestore(bookingId);
    addToast('warning', `Booking cancelled/removed.`);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteModalTarget) return;

    if (deleteModalTarget.type === 'client') {
      await deleteClient(deleteModalTarget.id);
    } else if (deleteModalTarget.type === 'purchase') {
      await deletePurchase(deleteModalTarget.id);
    } else if (deleteModalTarget.type === 'booking') {
      await deleteBooking(deleteModalTarget.id);
    }
    closeDeleteModal();
  };

  // Google Sheets logic
  const connectSpreadsheet = (sheet: DriveSpreadsheet) => {
    setConnectedSpreadsheetId(sheet.id);
    setConnectedSpreadsheetName(sheet.name);
    setConnectedSpreadsheetUrl(sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`);
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheet.id);
    localStorage.setItem(STORAGE_KEYS.SHEET_NAME, sheet.name);
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`);
    addToast('success', `Connected to Google Sheet: "${sheet.name}"`);
  };

  const disconnectSpreadsheet = () => {
    setConnectedSpreadsheetId(null);
    setConnectedSpreadsheetName(null);
    setConnectedSpreadsheetUrl(null);
    setLastSheetsSyncTime(null);
    localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.SHEET_NAME);
    localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
    localStorage.removeItem(STORAGE_KEYS.SHEET_SYNC_TIME);
    addToast('info', 'Disconnected Google Sheet.');
  };

  const exportToNewGoogleSheet = async (customTitle?: string) => {
    const token = await getAccessToken();
    if (!token) {
      addToast('error', 'Please sign in with Google first.');
      return { success: false, error: 'Not authenticated with Google' };
    }

    try {
      setIsSheetsSyncing(true);
      const title = customTitle || `Court Sessions & Bookings (${new Date().toLocaleDateString()})`;
      const result = await createNewSpreadsheetWithData(
        token,
        title,
        clients,
        purchases,
        bookings,
        getClientStats
      );

      setConnectedSpreadsheetId(result.spreadsheetId);
      setConnectedSpreadsheetName(title);
      setConnectedSpreadsheetUrl(result.spreadsheetUrl);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSyncTime(nowStr);

      addToast('success', 'Exported data to new Google Sheet!');
      return { success: true, url: result.spreadsheetUrl };
    } catch (err: any) {
      addToast('error', `Export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const syncToConnectedSheet = async () => {
    if (!connectedSpreadsheetId) {
      addToast('warning', 'No connected Google Sheet to sync.');
      return { success: false, error: 'No sheet connected' };
    }
    const token = await getAccessToken();
    if (!token) {
      addToast('error', 'Please sign in with Google first.');
      return { success: false, error: 'Not authenticated with Google' };
    }

    try {
      setIsSheetsSyncing(true);
      await exportAllDataToSpreadsheet(
        token,
        connectedSpreadsheetId,
        clients,
        purchases,
        bookings,
        getClientStats
      );
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSyncTime(nowStr);
      localStorage.setItem(STORAGE_KEYS.SHEET_SYNC_TIME, nowStr);
      addToast('success', 'Synced latest data to Google Sheet.');
      return { success: true };
    } catch (err: any) {
      addToast('error', `Sync failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const importFromConnectedSheet = async (customSpreadsheetId?: string) => {
    const targetId = customSpreadsheetId || connectedSpreadsheetId;
    if (!targetId) {
      addToast('warning', 'No Google Sheet ID provided for import.');
      return { success: false, error: 'No sheet ID' };
    }
    const token = await getAccessToken();
    if (!token) {
      addToast('error', 'Please sign in with Google first.');
      return { success: false, error: 'Not authenticated with Google' };
    }

    try {
      setIsSheetsSyncing(true);
      const imported = await importDataFromSpreadsheet(token, targetId);

      for (const c of imported.clients) {
        await addClientFirestore(c, c.id);
      }
      for (const p of imported.purchases) {
        await addPurchaseFirestore(p, p.id);
      }
      for (const b of imported.bookings) {
        await addBookingFirestore(b, [], b.id);
      }

      addToast('success', `Imported ${imported.clients.length} clients, ${imported.purchases.length} purchases, ${imported.bookings.length} bookings.`);
      return { success: true };
    } catch (err: any) {
      addToast('error', `Import failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const fetchDriveSpreadsheets = async (): Promise<DriveSpreadsheet[]> => {
    const token = await getAccessToken();
    if (!token) return [];
    try {
      return await listUserSpreadsheets(token);
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // Google Calendar actions
  const setSelectedCalendarId = (id: string, name?: string) => {
    setSelectedCalendarIdState(id);
    if (name) setSelectedCalendarName(name);
    localStorage.setItem(STORAGE_KEYS.CALENDAR_ID, id);
    if (name) localStorage.setItem(STORAGE_KEYS.CALENDAR_NAME, name);
  };

  const setAutoSyncCalendar = (enabled: boolean) => {
    setAutoSyncCalendarState(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_CAL, String(enabled));
  };

  const fetchUserCalendars = async (): Promise<GoogleCalendarItem[]> => {
    const token = await getAccessToken();
    if (!token) return [];
    try {
      setIsCalendarLoading(true);
      const cals = await listUserCalendars(token);
      setUserCalendars(cals);
      return cals;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const fetchCalendarEvents = async (timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> => {
    const token = await getAccessToken();
    if (!token) return [];
    try {
      setIsCalendarLoading(true);
      const events = await getCalendarEvents(token, selectedCalendarId, timeMin, timeMax);
      setCalendarEvents(events);
      return events;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const syncBookingToGoogleCalendar = async (bookingId: string) => {
    const token = await getAccessToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    try {
      setIsCalendarSyncing(true);
      if (booking.googleEventId) {
        const res = await updateCalendarEventForBooking(token, selectedCalendarId, booking.googleEventId, booking);
        await updateBookingFirestore({ ...booking, googleCalendarHtmlLink: res.htmlLink }, bookings);
        return { success: true, eventId: res.eventId, htmlLink: res.htmlLink };
      } else {
        const res = await createCalendarEventForBooking(token, selectedCalendarId, booking);
        await updateBookingFirestore(
          {
            ...booking,
            googleEventId: res.eventId,
            googleCalendarHtmlLink: res.htmlLink,
            googleCalendarId: selectedCalendarId,
          },
          bookings
        );
        return { success: true, eventId: res.eventId, htmlLink: res.htmlLink };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const deleteBookingFromGoogleCalendar = async (bookingId: string) => {
    const token = await getAccessToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.googleEventId) return { success: true };

    try {
      await deleteCalendarEvent(token, booking.googleCalendarId || selectedCalendarId, booking.googleEventId);
      await updateBookingFirestore(
        { ...booking, googleEventId: undefined, googleCalendarHtmlLink: undefined },
        bookings
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const syncAllBookingsToGoogleCalendar = async () => {
    const token = await getAccessToken();
    if (!token) return { success: false, syncedCount: 0, error: 'Not authenticated' };

    try {
      setIsCalendarSyncing(true);
      let count = 0;
      for (const b of bookings) {
        if (b.status !== 'Cancelled') {
          await syncBookingToGoogleCalendar(b.id);
          count++;
        }
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastCalendarSyncTime(nowStr);
      return { success: true, syncedCount: count };
    } catch (err: any) {
      return { success: false, syncedCount: 0, error: err.message };
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const importEventsAsBookings = async (events: GoogleCalendarEvent[]) => {
    let importedCount = 0;
    try {
      for (const event of events) {
        if (!event.start?.dateTime && !event.start?.date) continue;
        const startDate = event.start.dateTime ? event.start.dateTime.slice(0, 10) : event.start.date || '';
        const startTime = event.start.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : '09:00 AM';

        await addBookingFirestore(
          {
            clientId: clients[0]?.id || 'CLI0001',
            clientName: clients[0]?.name || event.summary || 'Guest',
            courtId: courts[0]?.id || 'court-1',
            courtName: courts[0]?.name || 'Court 1',
            startDate,
            startTime,
            durationHours: 1,
            status: 'Scheduled',
            notes: `Imported from Google Calendar: ${event.summary || ''}`,
            googleEventId: event.id,
            googleCalendarHtmlLink: event.htmlLink,
            googleCalendarId: selectedCalendarId,
          },
          bookings
        );
        importedCount++;
      }
      return { success: true, importedCount };
    } catch (err: any) {
      return { success: false, importedCount, error: err.message };
    }
  };

  const resetToSampleData = () => {
    addToast('info', 'Data is now backed by live Cloud Firestore.');
  };

  const exportDataJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ clients, purchases, bookings, courts }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `badminton_court_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.clients)) {
        for (const c of parsed.clients) addClientFirestore(c, c.id);
      }
      if (Array.isArray(parsed.purchases)) {
        for (const p of parsed.purchases) addPurchaseFirestore(p, p.id);
      }
      if (Array.isArray(parsed.bookings)) {
        for (const b of parsed.bookings) addBookingFirestore(b, [], b.id);
      }
      addToast('success', 'JSON backup imported into Firestore successfully.');
      return true;
    } catch (e) {
      addToast('error', 'Invalid JSON backup file format.');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        purchases,
        bookings,
        courts,
        isSheetsSyncing,
        connectedSpreadsheetId,
        connectedSpreadsheetName,
        connectedSpreadsheetUrl,
        lastSheetsSyncTime,
        isCalendarSyncing,
        isCalendarLoading,
        selectedCalendarId,
        selectedCalendarName,
        userCalendars,
        calendarEvents,
        lastCalendarSyncTime,
        autoSyncCalendar,
        getClientStats,
        getPurchaseStats,
        addClient,
        updateClient,
        deleteClient,
        addPurchase,
        updatePurchase,
        deletePurchase,
        addBooking,
        updateBooking,
        deleteBooking,
        confirmDelete,
        connectSpreadsheet,
        disconnectSpreadsheet,
        exportToNewGoogleSheet,
        syncToConnectedSheet,
        importFromConnectedSheet,
        fetchDriveSpreadsheets,
        setSelectedCalendarId,
        setAutoSyncCalendar,
        fetchUserCalendars,
        fetchCalendarEvents,
        syncBookingToGoogleCalendar,
        deleteBookingFromGoogleCalendar,
        syncAllBookingsToGoogleCalendar,
        importEventsAsBookings,
        resetToSampleData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
