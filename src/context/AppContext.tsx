import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Client,
  SessionPurchase,
  Booking,
  ClientStats,
  PurchaseStats,
  ActiveTab,
  ActiveView,
  GoogleCalendarItem,
  GoogleCalendarEvent,
} from '../types';
import { INITIAL_CLIENTS, INITIAL_PURCHASES, INITIAL_BOOKINGS } from '../data/mockData';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getAccessToken, logout as authLogout } from '../services/googleAuth';
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface DeleteTarget {
  type: 'client' | 'purchase' | 'booking';
  id: string;
  name: string;
  details?: string;
}

interface AppContextType {
  // State
  clients: Client[];
  purchases: SessionPurchase[];
  bookings: Booking[];
  activeTab: ActiveTab;
  activeView: ActiveView;
  searchQuery: string;
  isSearchOpen: boolean;
  isDrawerOpen: boolean;
  toasts: ToastMessage[];

  // Google Auth & Sheets State
  googleUser: User | null;
  isGoogleSigningIn: boolean;
  sheetsModalOpen: boolean;
  isSheetsSyncing: boolean;
  connectedSpreadsheetId: string | null;
  connectedSpreadsheetName: string | null;
  connectedSpreadsheetUrl: string | null;
  lastSheetsSyncTime: string | null;

  // Google Calendar State
  calendarModalOpen: boolean;
  isCalendarSyncing: boolean;
  isCalendarLoading: boolean;
  selectedCalendarId: string;
  selectedCalendarName: string;
  userCalendars: GoogleCalendarItem[];
  calendarEvents: GoogleCalendarEvent[];
  lastCalendarSyncTime: string | null;
  autoSyncCalendar: boolean;

  // Google Auth & Sheets Actions
  openSheetsModal: () => void;
  closeSheetsModal: () => void;
  signInWithGoogleAccount: () => Promise<boolean>;
  signOutGoogleAccount: () => Promise<void>;
  connectSpreadsheet: (sheet: DriveSpreadsheet) => void;
  disconnectSpreadsheet: () => void;
  exportToNewGoogleSheet: (customTitle?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  syncToConnectedSheet: () => Promise<{ success: boolean; error?: string }>;
  importFromConnectedSheet: (customSpreadsheetId?: string) => Promise<{ success: boolean; error?: string }>;
  fetchDriveSpreadsheets: () => Promise<DriveSpreadsheet[]>;

  // Google Calendar Actions
  openCalendarModal: () => void;
  closeCalendarModal: () => void;
  setSelectedCalendarId: (id: string, name?: string) => void;
  setAutoSyncCalendar: (enabled: boolean) => void;
  fetchUserCalendars: () => Promise<GoogleCalendarItem[]>;
  fetchCalendarEvents: (timeMin?: string, timeMax?: string) => Promise<GoogleCalendarEvent[]>;
  syncBookingToGoogleCalendar: (bookingId: string) => Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }>;
  deleteBookingFromGoogleCalendar: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  syncAllBookingsToGoogleCalendar: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;
  importEventsAsBookings: (events: GoogleCalendarEvent[]) => Promise<{ success: boolean; importedCount: number; error?: string }>;

  // Navigation
  setActiveTab: (tab: ActiveTab) => void;
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  navigateBack: () => void;

  // Stats Helpers
  getClientStats: (clientId: string) => ClientStats | null;
  getPurchaseStats: (purchaseId: string) => PurchaseStats | null;

  // CRUD for Clients
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;

  // CRUD for Purchases
  addPurchase: (purchaseData: Omit<SessionPurchase, 'id' | 'createdAt'>) => SessionPurchase;
  updatePurchase: (purchase: SessionPurchase) => void;
  deletePurchase: (purchaseId: string) => void;

  // CRUD for Bookings
  addBooking: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => { booking?: Booking; error?: string };
  updateBooking: (booking: Booking) => { success: boolean; error?: string };
  deleteBooking: (bookingId: string) => void;

  // Modals & UI helpers
  deleteModalTarget: DeleteTarget | null;
  openDeleteModal: (target: DeleteTarget) => void;
  closeDeleteModal: () => void;
  confirmDelete: () => void;

  // Active form modal states
  clientModalOpen: boolean;
  editingClient: Client | null;
  openClientModal: (client?: Client) => void;
  closeClientModal: () => void;

  purchaseModalOpen: boolean;
  editingPurchase: SessionPurchase | null;
  defaultPurchaseClientId?: string;
  openPurchaseModal: (purchase?: SessionPurchase, defaultClientId?: string) => void;
  closePurchaseModal: () => void;

  bookingModalOpen: boolean;
  editingBooking: Booking | null;
  defaultBookingClientId?: string;
  defaultBookingPurchaseId?: string;
  openBookingModal: (booking?: Booking, defaultClientId?: string, defaultPurchaseId?: string) => void;
  closeBookingModal: () => void;

  // Utility
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  resetToSampleData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonData: string) => boolean;
}

const STORAGE_KEYS = {
  CLIENTS: 'csb_clients_v1',
  PURCHASES: 'csb_purchases_v1',
  BOOKINGS: 'csb_bookings_v1',
  SHEET_ID: 'csb_sheet_id_v1',
  SHEET_NAME: 'csb_sheet_name_v1',
  SHEET_URL: 'csb_sheet_url_v1',
  SHEET_SYNC_TIME: 'csb_sheet_sync_time_v1',
  CALENDAR_ID: 'csb_cal_id_v1',
  CALENDAR_NAME: 'csb_cal_name_v1',
  CALENDAR_SYNC_TIME: 'csb_cal_sync_time_v1',
  AUTO_SYNC_CAL: 'csb_auto_sync_cal_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to initial mock data
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved clients', e);
      }
    }
    return INITIAL_CLIENTS;
  });

  const [purchases, setPurchases] = useState<SessionPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved purchases', e);
      }
    }
    return INITIAL_PURCHASES;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved bookings', e);
      }
    }
    return INITIAL_BOOKINGS;
  });

  // Google Workspace & Sheets State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [isSheetsSyncing, setIsSheetsSyncing] = useState(false);
  
  const [connectedSpreadsheetId, setConnectedSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEET_ID) || null;
  });
  const [connectedSpreadsheetName, setConnectedSpreadsheetName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEET_NAME) || null;
  });
  const [connectedSpreadsheetUrl, setConnectedSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || null;
  });
  const [lastSheetsSyncTime, setLastSheetsSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEET_SYNC_TIME) || null;
  });

  // Google Calendar State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CALENDAR_ID) || 'primary';
  });
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CALENDAR_NAME) || 'Primary Calendar';
  });
  const [userCalendars, setUserCalendars] = useState<GoogleCalendarItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [lastCalendarSyncTime, setLastCalendarSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CALENDAR_SYNC_TIME) || null;
  });
  const [autoSyncCalendar, setAutoSyncCalendarState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_CAL) === 'true';
  });

  // Navigation State
  const [activeTab, setActiveTabState] = useState<ActiveTab>('master');
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [deleteModalTarget, setDeleteModalTarget] = useState<DeleteTarget | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SessionPurchase | null>(null);
  const [defaultPurchaseClientId, setDefaultPurchaseClientId] = useState<string | undefined>();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [defaultBookingClientId, setDefaultBookingClientId] = useState<string | undefined>();
  const [defaultBookingPurchaseId, setDefaultBookingPurchaseId] = useState<string | undefined>();

  // Init Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    if (connectedSpreadsheetId) {
      localStorage.setItem(STORAGE_KEYS.SHEET_ID, connectedSpreadsheetId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    }
  }, [connectedSpreadsheetId]);

  useEffect(() => {
    if (connectedSpreadsheetName) {
      localStorage.setItem(STORAGE_KEYS.SHEET_NAME, connectedSpreadsheetName);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEET_NAME);
    }
  }, [connectedSpreadsheetName]);

  useEffect(() => {
    if (connectedSpreadsheetUrl) {
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, connectedSpreadsheetUrl);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
    }
  }, [connectedSpreadsheetUrl]);

  useEffect(() => {
    if (lastSheetsSyncTime) {
      localStorage.setItem(STORAGE_KEYS.SHEET_SYNC_TIME, lastSheetsSyncTime);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SHEET_SYNC_TIME);
    }
  }, [lastSheetsSyncTime]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_ID, selectedCalendarId);
  }, [selectedCalendarId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_NAME, selectedCalendarName);
  }, [selectedCalendarName]);

  useEffect(() => {
    if (lastCalendarSyncTime) {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_SYNC_TIME, lastCalendarSyncTime);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CALENDAR_SYNC_TIME);
    }
  }, [lastCalendarSyncTime]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_CAL, String(autoSyncCalendar));
  }, [autoSyncCalendar]);

  // Toast helper
  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Google Auth Methods
  const signInWithGoogleAccount = async (): Promise<boolean> => {
    try {
      setIsGoogleSigningIn(true);
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        addToast('success', `Signed in as ${res.user.displayName || res.user.email}`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Sign in failure', err);
      addToast('error', err.message || 'Failed to sign in with Google');
      return false;
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const signOutGoogleAccount = async () => {
    await authLogout();
    setGoogleUser(null);
    addToast('info', 'Signed out from Google account');
  };

  const connectSpreadsheet = (sheet: DriveSpreadsheet) => {
    setConnectedSpreadsheetId(sheet.id);
    setConnectedSpreadsheetName(sheet.name);
    setConnectedSpreadsheetUrl(sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`);
    addToast('success', `Linked spreadsheet: "${sheet.name}"`);
  };

  const disconnectSpreadsheet = () => {
    setConnectedSpreadsheetId(null);
    setConnectedSpreadsheetName(null);
    setConnectedSpreadsheetUrl(null);
    addToast('info', 'Disconnected spreadsheet link');
  };

  const openSheetsModal = () => {
    setSheetsModalOpen(true);
  };

  const closeSheetsModal = () => {
    setSheetsModalOpen(false);
  };

  const fetchDriveSpreadsheets = async (): Promise<DriveSpreadsheet[]> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Please sign in with Google first');
    }
    return await listUserSpreadsheets(token);
  };

  // Navigation
  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    setActiveView({ type: 'list' });
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const navigateBack = () => {
    setActiveView({ type: 'list' });
  };

  // Helper ID generators
  const getNextClientId = (): string => {
    const nums = clients
      .map((c) => {
        const match = c.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `CLI${nextNum.toString().padStart(4, '0')}`;
  };

  const getNextPurchaseId = (): string => {
    const nums = purchases
      .map((p) => {
        const match = p.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `Pur${nextNum.toString().padStart(4, '0')}`;
  };

  const getNextBookingId = (): string => {
    const nums = bookings
      .map((b) => {
        const match = b.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `BK${nextNum.toString().padStart(4, '0')}`;
  };

  // Calculations
  const getClientStats = (clientId: string): ClientStats | null => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    const relatedPurchases = purchases.filter((p) => p.clientId === clientId);
    const relatedBookings = bookings.filter((b) => b.clientId === clientId);

    const totalHoursPurchased = relatedPurchases.reduce((sum, p) => sum + (Number(p.hoursPurchased) || 0), 0);
    
    // Slots used: all active bookings (exclude Cancelled)
    const totalSlotsUsed = relatedBookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (Number(b.durationHours) || 0), 0);

    const hoursRemaining = totalHoursPurchased - totalSlotsUsed;

    // Calculate earliest booking date
    let firstBookingDate = client.firstBookingDate || '';
    if (!firstBookingDate && relatedBookings.length > 0) {
      const sorted = [...relatedBookings].sort((a, b) => a.startDate.localeCompare(b.startDate));
      firstBookingDate = sorted[0].startDate;
    }

    return {
      client,
      totalHoursPurchased,
      totalSlotsUsed,
      hoursRemaining,
      firstBookingDate: firstBookingDate || 'Not booked yet',
      purchaseCount: relatedPurchases.length,
      bookingCount: relatedBookings.length,
      relatedPurchases,
      relatedBookings,
    };
  };

  const getPurchaseStats = (purchaseId: string): PurchaseStats | null => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return null;

    const relatedBookings = bookings.filter((b) => b.purchaseId === purchaseId);
    const slotsUsed = relatedBookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (Number(b.durationHours) || 0), 0);

    const hoursRemaining = (Number(purchase.hoursPurchased) || 0) - slotsUsed;

    return {
      purchase,
      slotsUsed,
      hoursRemaining,
      relatedBookings,
    };
  };

  // Client CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: getNextClientId(),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    addToast('success', `Client ${newClient.name} (${newClient.id}) created.`);
    return newClient;
  };

  const updateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Also update clientName in purchases and bookings
    setPurchases((prev) =>
      prev.map((p) => (p.clientId === updated.id ? { ...p, clientName: updated.name } : p))
    );
    setBookings((prev) =>
      prev.map((b) => (b.clientId === updated.id ? { ...b, clientName: updated.name } : b))
    );
    addToast('success', `Client ${updated.name} updated.`);
  };

  const deleteClient = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;

    setClients((prev) => prev.filter((c) => c.id !== clientId));
    // Also delete or unlink related purchases and bookings
    setPurchases((prev) => prev.filter((p) => p.clientId !== clientId));
    setBookings((prev) => prev.filter((b) => b.clientId !== clientId));

    if (activeView.type === 'client-detail' && activeView.clientId === clientId) {
      setActiveView({ type: 'list' });
    }
    addToast('info', `Client ${target.name} and related records removed.`);
  };

  // Purchase CRUD
  const addPurchase = (purchaseData: Omit<SessionPurchase, 'id' | 'createdAt'>): SessionPurchase => {
    const client = clients.find((c) => c.id === purchaseData.clientId);
    const newPurchase: SessionPurchase = {
      ...purchaseData,
      clientName: client ? client.name : purchaseData.clientName,
      id: getNextPurchaseId(),
      createdAt: new Date().toISOString(),
    };
    setPurchases((prev) => [...prev, newPurchase]);
    addToast('success', `Purchase ${newPurchase.id} (${newPurchase.hoursPurchased} hrs) added for ${newPurchase.clientName}.`);
    return newPurchase;
  };

  const updatePurchase = (updated: SessionPurchase) => {
    const client = clients.find((c) => c.id === updated.clientId);
    const finalPurchase = {
      ...updated,
      clientName: client ? client.name : updated.clientName,
    };
    setPurchases((prev) => prev.map((p) => (p.id === updated.id ? finalPurchase : p)));
    addToast('success', `Purchase ${updated.id} updated.`);
  };

  const deletePurchase = (purchaseId: string) => {
    const target = purchases.find((p) => p.id === purchaseId);
    if (!target) return;

    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    // Clear purchaseId link on bookings
    setBookings((prev) =>
      prev.map((b) => (b.purchaseId === purchaseId ? { ...b, purchaseId: undefined } : b))
    );

    if (activeView.type === 'purchase-detail' && activeView.purchaseId === purchaseId) {
      setActiveView({ type: 'list' });
    }
    addToast('info', `Purchase ${target.id} deleted.`);
  };

  // Booking CRUD
  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>): { booking?: Booking; error?: string } => {
    const client = clients.find((c) => c.id === bookingData.clientId);
    if (!client) {
      return { error: 'Client not found' };
    }

    const newBooking: Booking = {
      ...bookingData,
      clientName: client.name,
      id: getNextBookingId(),
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [...prev, newBooking]);

    // If client does not have firstBookingDate, set it
    if (!client.firstBookingDate) {
      updateClient({
        ...client,
        firstBookingDate: newBooking.startDate,
      });
    }

    addToast('success', `Booking ${newBooking.id} created for ${client.name}.`);
    return { booking: newBooking };
  };

  const updateBooking = (updated: Booking): { success: boolean; error?: string } => {
    const client = clients.find((c) => c.id === updated.clientId);
    const finalBooking: Booking = {
      ...updated,
      clientName: client ? client.name : updated.clientName,
    };

    setBookings((prev) => prev.map((b) => (b.id === updated.id ? finalBooking : b)));
    addToast('success', `Booking ${updated.id} updated.`);
    return { success: true };
  };

  const deleteBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    if (activeView.type === 'booking-detail' && activeView.bookingId === bookingId) {
      setActiveView({ type: 'list' });
    }
    addToast('info', `Booking ${target.id} deleted.`);
  };

  // Delete Modal Helpers
  const openDeleteModal = (target: DeleteTarget) => {
    setDeleteModalTarget(target);
  };

  const closeDeleteModal = () => {
    setDeleteModalTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteModalTarget) return;
    if (deleteModalTarget.type === 'client') {
      deleteClient(deleteModalTarget.id);
    } else if (deleteModalTarget.type === 'purchase') {
      deletePurchase(deleteModalTarget.id);
    } else if (deleteModalTarget.type === 'booking') {
      deleteBooking(deleteModalTarget.id);
    }
    closeDeleteModal();
  };

  // Modal Openers
  const openClientModal = (client?: Client) => {
    setEditingClient(client || null);
    setClientModalOpen(true);
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setEditingClient(null);
  };

  const openPurchaseModal = (purchase?: SessionPurchase, defaultClientId?: string) => {
    setEditingPurchase(purchase || null);
    setDefaultPurchaseClientId(defaultClientId);
    setPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false);
    setEditingPurchase(null);
    setDefaultPurchaseClientId(undefined);
  };

  const openBookingModal = (booking?: Booking, defaultClientId?: string, defaultPurchaseId?: string) => {
    setEditingBooking(booking || null);
    setDefaultBookingClientId(defaultClientId);
    setDefaultBookingPurchaseId(defaultPurchaseId);
    setBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setBookingModalOpen(false);
    setEditingBooking(null);
    setDefaultBookingClientId(undefined);
    setDefaultBookingPurchaseId(undefined);
  };

  // Reset & Backup
  const resetToSampleData = () => {
    setClients(INITIAL_CLIENTS);
    setPurchases(INITIAL_PURCHASES);
    setBookings(INITIAL_BOOKINGS);
    setActiveView({ type: 'list' });
    setIsDrawerOpen(false);
    addToast('success', 'Reset all records to sample reference data.');
  };

  const exportDataJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      clients,
      purchases,
      bookings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-session-booking-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Data exported successfully.');
  };

  const importDataJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.clients) && Array.isArray(parsed.purchases) && Array.isArray(parsed.bookings)) {
        setClients(parsed.clients);
        setPurchases(parsed.purchases);
        setBookings(parsed.bookings);
        addToast('success', 'Data imported successfully.');
        setIsDrawerOpen(false);
        return true;
      }
      addToast('error', 'Invalid JSON backup format.');
      return false;
    } catch (e) {
      addToast('error', 'Failed to parse JSON file.');
      return false;
    }
  };

  const exportToNewGoogleSheet = async (customTitle?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Please sign in with Google first' };
    }

    try {
      setIsSheetsSyncing(true);
      const title = customTitle || `Client Sessions & Bookings (${new Date().toLocaleDateString()})`;
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
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSyncTime(now);

      addToast('success', `Created & synced spreadsheet "${title}"`);
      return { success: true, url: result.spreadsheetUrl };
    } catch (err: any) {
      console.error('Export error', err);
      addToast('error', err.message || 'Failed to export to Google Sheets');
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const syncToConnectedSheet = async (): Promise<{ success: boolean; error?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Please sign in with Google first' };
    }
    if (!connectedSpreadsheetId) {
      return { success: false, error: 'No connected spreadsheet selected' };
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

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSyncTime(now);
      addToast('success', `Exported all data to "${connectedSpreadsheetName || 'Google Sheet'}"`);
      return { success: true };
    } catch (err: any) {
      console.error('Sync error', err);
      addToast('error', err.message || 'Failed to update Google Sheet');
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  const importFromConnectedSheet = async (customSpreadsheetId?: string): Promise<{ success: boolean; error?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Please sign in with Google first' };
    }
    const targetId = customSpreadsheetId || connectedSpreadsheetId;
    if (!targetId) {
      return { success: false, error: 'No spreadsheet selected to import from' };
    }

    try {
      setIsSheetsSyncing(true);
      const imported = await importDataFromSpreadsheet(token, targetId);

      if (imported.clients.length === 0 && imported.purchases.length === 0 && imported.bookings.length === 0) {
        throw new Error('No valid records found in spreadsheet tabs (Clients, Purchases, Bookings).');
      }

      setClients(imported.clients);
      setPurchases(imported.purchases);
      setBookings(imported.bookings);

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSyncTime(now);

      addToast(
        'success',
        `Imported ${imported.clients.length} clients, ${imported.purchases.length} purchases, ${imported.bookings.length} bookings from Google Sheets!`
      );
      return { success: true };
    } catch (err: any) {
      console.error('Import error', err);
      addToast('error', err.message || 'Failed to import from Google Sheets');
      return { success: false, error: err.message };
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  // Google Calendar Methods
  const openCalendarModal = () => {
    setCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setCalendarModalOpen(false);
  };

  const setSelectedCalendarId = (id: string, name?: string) => {
    setSelectedCalendarIdState(id);
    if (name) {
      setSelectedCalendarName(name);
    }
    addToast('info', `Active calendar set to: ${name || id}`);
  };

  const setAutoSyncCalendar = (enabled: boolean) => {
    setAutoSyncCalendarState(enabled);
    addToast('info', enabled ? 'Auto-sync with Google Calendar enabled.' : 'Auto-sync with Google Calendar disabled.');
  };

  const fetchUserCalendars = async (): Promise<GoogleCalendarItem[]> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Please sign in with Google first');
    }
    try {
      setIsCalendarLoading(true);
      const items = await listUserCalendars(token);
      setUserCalendars(items);
      return items;
    } catch (err: any) {
      console.error('Failed to list user calendars', err);
      addToast('error', err.message || 'Failed to fetch Google Calendars');
      throw err;
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const fetchCalendarEvents = async (timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Please sign in with Google first');
    }
    try {
      setIsCalendarLoading(true);
      const events = await getCalendarEvents(token, selectedCalendarId, timeMin, timeMax);
      setCalendarEvents(events);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastCalendarSyncTime(now);
      return events;
    } catch (err: any) {
      console.error('Failed to fetch calendar events', err);
      addToast('error', err.message || 'Failed to fetch calendar events');
      throw err;
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const syncBookingToGoogleCalendar = async (
    bookingId: string
  ): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Please sign in with Google first' };
    }

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    try {
      setIsCalendarSyncing(true);
      if (booking.googleEventId) {
        // Update existing
        const res = await updateCalendarEventForBooking(
          token,
          booking.googleCalendarId || selectedCalendarId,
          booking.googleEventId,
          booking
        );
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  googleEventId: res.eventId,
                  googleCalendarHtmlLink: res.htmlLink,
                  googleCalendarId: booking.googleCalendarId || selectedCalendarId,
                }
              : b
          )
        );
        addToast('success', `Updated event on Google Calendar for booking ${booking.id}`);
        return { success: true, eventId: res.eventId, htmlLink: res.htmlLink };
      } else {
        // Create new
        const res = await createCalendarEventForBooking(token, selectedCalendarId, booking);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  googleEventId: res.eventId,
                  googleCalendarHtmlLink: res.htmlLink,
                  googleCalendarId: selectedCalendarId,
                }
              : b
          )
        );
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastCalendarSyncTime(now);
        addToast('success', `Scheduled event added to Google Calendar for ${booking.clientName}`);
        return { success: true, eventId: res.eventId, htmlLink: res.htmlLink };
      }
    } catch (err: any) {
      console.error('Failed to sync booking to calendar', err);
      addToast('error', err.message || 'Failed to sync with Google Calendar');
      return { success: false, error: err.message };
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const deleteBookingFromGoogleCalendar = async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Please sign in with Google first' };
    }

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.googleEventId) {
      return { success: true };
    }

    try {
      setIsCalendarSyncing(true);
      await deleteCalendarEvent(
        token,
        booking.googleCalendarId || selectedCalendarId,
        booking.googleEventId
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                googleEventId: undefined,
                googleCalendarHtmlLink: undefined,
                googleCalendarId: undefined,
              }
            : b
        )
      );
      addToast('info', `Event removed from Google Calendar for booking ${booking.id}`);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete calendar event', err);
      addToast('error', err.message || 'Failed to remove event from Google Calendar');
      return { success: false, error: err.message };
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const syncAllBookingsToGoogleCalendar = async (): Promise<{
    success: boolean;
    syncedCount: number;
    error?: string;
  }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, syncedCount: 0, error: 'Please sign in with Google first' };
    }

    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
    if (activeBookings.length === 0) {
      addToast('info', 'No active bookings to sync.');
      return { success: true, syncedCount: 0 };
    }

    try {
      setIsCalendarSyncing(true);
      let count = 0;
      const updatedBookings = [...bookings];

      for (let i = 0; i < updatedBookings.length; i++) {
        const b = updatedBookings[i];
        if (b.status === 'Cancelled') continue;

        try {
          if (b.googleEventId) {
            const res = await updateCalendarEventForBooking(
              token,
              b.googleCalendarId || selectedCalendarId,
              b.googleEventId,
              b
            );
            updatedBookings[i] = {
              ...b,
              googleEventId: res.eventId,
              googleCalendarHtmlLink: res.htmlLink,
            };
          } else {
            const res = await createCalendarEventForBooking(token, selectedCalendarId, b);
            updatedBookings[i] = {
              ...b,
              googleEventId: res.eventId,
              googleCalendarHtmlLink: res.htmlLink,
              googleCalendarId: selectedCalendarId,
            };
          }
          count++;
        } catch (e) {
          console.warn(`Failed to sync booking ${b.id}`, e);
        }
      }

      setBookings(updatedBookings);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastCalendarSyncTime(now);
      addToast('success', `Synced ${count} bookings with Google Calendar!`);
      return { success: true, syncedCount: count };
    } catch (err: any) {
      console.error('Sync all to calendar failed', err);
      addToast('error', err.message || 'Failed to sync bookings to Google Calendar');
      return { success: false, syncedCount: 0, error: err.message };
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const importEventsAsBookings = async (
    events: GoogleCalendarEvent[]
  ): Promise<{ success: boolean; importedCount: number; error?: string }> => {
    if (!events || events.length === 0) {
      return { success: true, importedCount: 0 };
    }

    try {
      let importedCount = 0;
      const newBookings: Booking[] = [...bookings];
      const newClients: Client[] = [...clients];

      for (const ev of events) {
        // Skip if already linked to a booking
        if (newBookings.some((b) => b.googleEventId === ev.id)) {
          continue;
        }

        // Determine start date and time
        let startDate = new Date().toISOString().slice(0, 10);
        let startTime = '09:00 AM';
        let durationHours = 1;

        if (ev.start?.dateTime) {
          const startObj = new Date(ev.start.dateTime);
          startDate = startObj.toISOString().slice(0, 10);
          startTime = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (ev.end?.dateTime) {
            const endObj = new Date(ev.end.dateTime);
            const diffMs = endObj.getTime() - startObj.getTime();
            const diffHours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2);
            durationHours = diffHours;
          }
        } else if (ev.start?.date) {
          startDate = ev.start.date;
          startTime = '09:00 AM';
          durationHours = 4;
        }

        // Match client or create temporary client
        let matchedClient = newClients.find((c) =>
          ev.summary?.toLowerCase().includes(c.name.toLowerCase()) ||
          (ev.description && ev.description.toLowerCase().includes(c.name.toLowerCase()))
        );

        if (!matchedClient) {
          // Extract a name or use event summary
          const clientName = ev.summary?.replace(/\[BK\d+\]/gi, '').trim() || 'Calendar Client';
          const newClientId = `CLI${(newClients.length + 1).toString().padStart(4, '0')}`;
          matchedClient = {
            id: newClientId,
            name: clientName,
            phone: '0000000000',
            notes: 'Google Calendar Import',
            firstBookingDate: startDate,
            createdAt: new Date().toISOString(),
          };
          newClients.push(matchedClient);
        }

        const nextBNum = newBookings.length + 1;
        const newBookingId = `BK${nextBNum.toString().padStart(4, '0')}`;

        newBookings.push({
          id: newBookingId,
          clientId: matchedClient.id,
          clientName: matchedClient.name,
          startDate,
          startTime,
          durationHours,
          status: 'Scheduled',
          notes: ev.description || ev.summary || 'Imported from Google Calendar',
          googleEventId: ev.id,
          googleCalendarHtmlLink: ev.htmlLink,
          googleCalendarId: selectedCalendarId,
          createdAt: new Date().toISOString(),
        });

        importedCount++;
      }

      setClients(newClients);
      setBookings(newBookings);
      addToast('success', `Imported ${importedCount} event(s) as new bookings!`);
      return { success: true, importedCount };
    } catch (err: any) {
      console.error('Import calendar events error', err);
      addToast('error', err.message || 'Failed to import calendar events');
      return { success: false, importedCount: 0, error: err.message };
    }
  };

  const value = {
    clients,
    purchases,
    bookings,
    activeTab,
    activeView,
    searchQuery,
    isSearchOpen,
    isDrawerOpen,
    toasts,
    googleUser,
    isGoogleSigningIn,
    sheetsModalOpen,
    isSheetsSyncing,
    connectedSpreadsheetId,
    connectedSpreadsheetName,
    connectedSpreadsheetUrl,
    lastSheetsSyncTime,
    calendarModalOpen,
    isCalendarSyncing,
    isCalendarLoading,
    selectedCalendarId,
    selectedCalendarName,
    userCalendars,
    calendarEvents,
    lastCalendarSyncTime,
    autoSyncCalendar,
    openSheetsModal,
    closeSheetsModal,
    signInWithGoogleAccount,
    signOutGoogleAccount,
    connectSpreadsheet,
    disconnectSpreadsheet,
    exportToNewGoogleSheet,
    syncToConnectedSheet,
    importFromConnectedSheet,
    fetchDriveSpreadsheets,
    openCalendarModal,
    closeCalendarModal,
    setSelectedCalendarId,
    setAutoSyncCalendar,
    fetchUserCalendars,
    fetchCalendarEvents,
    syncBookingToGoogleCalendar,
    deleteBookingFromGoogleCalendar,
    syncAllBookingsToGoogleCalendar,
    importEventsAsBookings,
    setActiveTab,
    setActiveView,
    setSearchQuery,
    setIsSearchOpen,
    setIsDrawerOpen,
    navigateBack,
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
    deleteModalTarget,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    clientModalOpen,
    editingClient,
    openClientModal,
    closeClientModal,
    purchaseModalOpen,
    editingPurchase,
    defaultPurchaseClientId,
    openPurchaseModal,
    closePurchaseModal,
    bookingModalOpen,
    editingBooking,
    defaultBookingClientId,
    defaultBookingPurchaseId,
    openBookingModal,
    closeBookingModal,
    addToast,
    removeToast,
    resetToSampleData,
    exportDataJSON,
    importDataJSON,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
