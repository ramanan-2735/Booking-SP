import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ActiveTab, ActiveView, Client, SessionPurchase, Booking } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface DeleteTarget {
  type: 'client' | 'purchase' | 'booking';
  id: string;
  name: string;
  details?: string;
}

interface UIContextType {
  activeTab: ActiveTab;
  activeView: ActiveView;
  searchQuery: string;
  isSearchOpen: boolean;
  isDrawerOpen: boolean;
  toasts: ToastMessage[];
  deleteModalTarget: DeleteTarget | null;

  clientModalOpen: boolean;
  editingClient: Client | null;

  purchaseModalOpen: boolean;
  editingPurchase: SessionPurchase | null;
  defaultPurchaseClientId?: string;

  bookingModalOpen: boolean;
  editingBooking: Booking | null;
  defaultBookingClientId?: string;
  defaultBookingPurchaseId?: string;

  sheetsModalOpen: boolean;
  calendarModalOpen: boolean;

  setActiveTab: (tab: ActiveTab) => void;
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  navigateBack: () => void;

  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;

  openDeleteModal: (target: DeleteTarget) => void;
  closeDeleteModal: () => void;

  openClientModal: (client?: Client) => void;
  closeClientModal: () => void;

  openPurchaseModal: (purchase?: SessionPurchase, defaultClientId?: string) => void;
  closePurchaseModal: () => void;

  openBookingModal: (booking?: Booking, defaultClientId?: string, defaultPurchaseId?: string) => void;
  closeBookingModal: () => void;

  openSheetsModal: () => void;
  closeSheetsModal: () => void;

  openCalendarModal: () => void;
  closeCalendarModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveTab>('master');
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'list' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
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

  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    setActiveView({ type: 'list' });
    setSearchQuery('');
  };

  const navigateBack = () => {
    setActiveView({ type: 'list' });
  };

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openDeleteModal = (target: DeleteTarget) => setDeleteModalTarget(target);
  const closeDeleteModal = () => setDeleteModalTarget(null);

  const openClientModal = (client?: Client) => {
    setEditingClient(client || null);
    setClientModalOpen(true);
  };
  const closeClientModal = () => {
    setEditingClient(null);
    setClientModalOpen(false);
  };

  const openPurchaseModal = (purchase?: SessionPurchase, defaultClientId?: string) => {
    setEditingPurchase(purchase || null);
    setDefaultPurchaseClientId(defaultClientId);
    setPurchaseModalOpen(true);
  };
  const closePurchaseModal = () => {
    setEditingPurchase(null);
    setDefaultPurchaseClientId(undefined);
    setPurchaseModalOpen(false);
  };

  const openBookingModal = (booking?: Booking, defaultClientId?: string, defaultPurchaseId?: string) => {
    setEditingBooking(booking || null);
    setDefaultBookingClientId(defaultClientId);
    setDefaultBookingPurchaseId(defaultPurchaseId);
    setBookingModalOpen(true);
  };
  const closeBookingModal = () => {
    setEditingBooking(null);
    setDefaultBookingClientId(undefined);
    setDefaultBookingPurchaseId(undefined);
    setBookingModalOpen(false);
  };

  const openSheetsModal = () => setSheetsModalOpen(true);
  const closeSheetsModal = () => setSheetsModalOpen(false);

  const openCalendarModal = () => setCalendarModalOpen(true);
  const closeCalendarModal = () => setCalendarModalOpen(false);

  return (
    <UIContext.Provider
      value={{
        activeTab,
        activeView,
        searchQuery,
        isSearchOpen,
        isDrawerOpen,
        toasts,
        deleteModalTarget,
        clientModalOpen,
        editingClient,
        purchaseModalOpen,
        editingPurchase,
        defaultPurchaseClientId,
        bookingModalOpen,
        editingBooking,
        defaultBookingClientId,
        defaultBookingPurchaseId,
        sheetsModalOpen,
        calendarModalOpen,
        setActiveTab,
        setActiveView,
        setSearchQuery,
        setIsSearchOpen,
        setIsDrawerOpen,
        navigateBack,
        addToast,
        removeToast,
        openDeleteModal,
        closeDeleteModal,
        openClientModal,
        closeClientModal,
        openPurchaseModal,
        closePurchaseModal,
        openBookingModal,
        closeBookingModal,
        openSheetsModal,
        closeSheetsModal,
        openCalendarModal,
        closeCalendarModal,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
