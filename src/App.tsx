/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNav } from './components/layout/BottomNav';
import { DrawerMenu } from './components/layout/DrawerMenu';
import { FAB } from './components/common/FAB';
import { ToastContainer } from './components/common/Toast';
import { DeleteConfirmModal } from './components/common/DeleteConfirmModal';

import { ClientList } from './components/clients/ClientList';
import { ClientDetail } from './components/clients/ClientDetail';
import { ClientFormModal } from './components/clients/ClientFormModal';

import { PurchaseList } from './components/purchases/PurchaseList';
import { PurchaseDetail } from './components/purchases/PurchaseDetail';
import { PurchaseFormModal } from './components/purchases/PurchaseFormModal';

import { BookingList } from './components/bookings/BookingList';
import { BookingDetail } from './components/bookings/BookingDetail';
import { BookingFormModal } from './components/bookings/BookingFormModal';
import { GoogleSheetsModal } from './components/sheets/GoogleSheetsModal';
import { CalendarView } from './components/calendar/CalendarView';
import { GoogleCalendarModal } from './components/calendar/GoogleCalendarModal';

import { SidebarNav } from './components/layout/SidebarNav';

const AppContent: React.FC = () => {
  const { activeTab, activeView } = useApp();

  const renderMainView = () => {
    // Detail views have priority over tab list views
    if (activeView.type === 'client-detail') {
      return <ClientDetail clientId={activeView.clientId} />;
    }
    if (activeView.type === 'purchase-detail') {
      return <PurchaseDetail purchaseId={activeView.purchaseId} />;
    }
    if (activeView.type === 'booking-detail') {
      return <BookingDetail bookingId={activeView.bookingId} />;
    }

    // Tab lists
    switch (activeTab) {
      case 'master':
        return <ClientList />;
      case 'purchases':
        return <PurchaseList />;
      case 'bookings':
        return <BookingList />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <ClientList />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f15] text-gray-100 font-sans flex">
      {/* Persistent Sidebar Navigation for Tablet & Desktop (md+) */}
      <SidebarNav />

      {/* Main Responsive Application View */}
      <div className="flex-1 min-h-screen bg-[#11131b] flex flex-col relative">
        {/* Top App Bar */}
        <TopAppBar />

        {/* Dynamic Main Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 overflow-y-auto">
          {renderMainView()}
        </main>

        {/* Floating Action Button (Mobile) */}
        <div className="md:hidden">
          <FAB />
        </div>

        {/* Fixed Bottom Navigation (Mobile) */}
        <BottomNav />

        {/* Drawers and Modals */}
        <DrawerMenu />
        <DeleteConfirmModal />
        <ClientFormModal />
        <PurchaseFormModal />
        <BookingFormModal />
        <ToastContainer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
