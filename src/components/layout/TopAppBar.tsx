import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, ArrowLeft, Search, RotateCw, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAllDataToExcel } from '../../utils/excelExport';

export const TopAppBar: React.FC = () => {
  const {
    activeTab,
    activeView,
    navigateBack,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    setIsDrawerOpen,
    clients,
    purchases,
    bookings,
    getClientStats,
    addToast,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Data refreshed successfully');
    }, 450);
  };

  const getTitle = () => {
    if (activeView.type === 'client-detail') return 'Client Details';
    if (activeView.type === 'purchase-detail') return 'Purchase Details';
    if (activeView.type === 'booking-detail') return 'Booking Details';

    switch (activeTab) {
      case 'master':
        return 'Master';
      case 'purchases':
        return 'Sessions Purchase';
      case 'bookings':
        return 'Bookings';
      case 'calendar':
        return 'Calendar Timeline';
    }
  };

  const isDetailView = activeView.type !== 'list';

  return (
    <header className="sticky top-0 z-30 bg-[#12151d] border-b border-[#212634] shadow-md select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-15 flex items-center justify-between gap-2">
        {/* Left: Back Arrow or Hamburger Menu */}
        <div className="flex items-center gap-2.5">
          {isDetailView ? (
            <button
              id="top-back-btn"
              onClick={navigateBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/80 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              id="top-menu-btn"
              onClick={() => setIsDrawerOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/80 active:scale-95 transition-all md:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* Title */}
          {!isSearchOpen && (
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{getTitle()}</span>
              {activeTab === 'purchases' && !isDetailView && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                  Hours
                </span>
              )}
              {activeTab === 'calendar' && !isDetailView && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  Live Sync
                </span>
              )}
            </h1>
          )}
        </div>

        {/* Search input when open */}
        {isSearchOpen && (
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2c] border border-amber-500/50 rounded-xl">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={`Search ${getTitle().toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Right Action Icons: Export Excel, Search & Refresh */}
        <div className="flex items-center gap-1">
          {/* Export Excel button */}
          <button
            id="top-excel-export-btn"
            onClick={() => exportAllDataToExcel(clients, purchases, bookings, getClientStats)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95 transition-all border border-emerald-500/20"
            aria-label="Download Excel Report"
            title="Download Excel Report (.xlsx)"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            id="top-search-toggle"
            onClick={() => {
              if (isSearchOpen) {
                setSearchQuery('');
              }
              setIsSearchOpen(!isSearchOpen);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isSearchOpen
                ? 'bg-amber-400 text-gray-950 font-bold shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/80 active:scale-95'
            }`}
            aria-label="Search"
          >
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <button
            id="top-refresh-btn"
            onClick={handleRefresh}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/80 active:scale-95 transition-all"
            aria-label="Refresh"
          >
            <RotateCw
              className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};


