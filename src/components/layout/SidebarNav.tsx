import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  Users,
  ShoppingBag,
  CalendarCheck,
  CalendarDays,
  Plus,
  Download,
} from 'lucide-react';
import { exportAllDataToExcel } from '../../utils/excelExport';

export const SidebarNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    clients,
    purchases,
    bookings,
    openBookingModal,
    openClientModal,
    openPurchaseModal,
    getClientStats,
  } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count: number }[] = [
    {
      id: 'master',
      label: 'Clients Directory',
      icon: Users,
      count: clients.length,
    },
    {
      id: 'purchases',
      label: 'Session Purchases',
      icon: ShoppingBag,
      count: purchases.length,
    },
    {
      id: 'bookings',
      label: 'Court Bookings',
      icon: CalendarCheck,
      count: bookings.length,
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: CalendarDays,
      count: bookings.filter((b) => b.status !== 'Cancelled').length,
    },
  ];

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#11131b] border-r border-[#1c212e] flex-col shrink-0 min-h-screen p-5 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
          🏸
        </div>
        <div>
          <h2 className="font-extrabold text-white text-base tracking-tight leading-tight">
            BSC Booking
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">Court & Pass Manager</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
          Management
        </p>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                isActive
                  ? 'bg-amber-400/15 text-amber-400 font-bold border border-amber-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-[#181d28]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-amber-400 text-gray-950' : 'bg-[#1b202c] text-gray-400 border border-gray-800'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
          Quick Actions
        </p>
        <button
          onClick={() => openBookingModal()}
          className="w-full py-2.5 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openClientModal()}
            className="py-2 px-2.5 rounded-xl bg-[#161a25] hover:bg-[#1f2535] border border-[#272e40] text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Client</span>
          </button>

          <button
            onClick={() => openPurchaseModal()}
            className="py-2 px-2.5 rounded-xl bg-[#161a25] hover:bg-[#1f2535] border border-[#272e40] text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Pass</span>
          </button>
        </div>

        <div className="pt-1">
          <button
            onClick={() => exportAllDataToExcel(clients, purchases, bookings, getClientStats)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Excel Report</span>
          </button>
        </div>
      </div>

      {/* Footer / System Info */}
      <div className="mt-auto pt-4 border-t border-[#1c212e]">
        <div className="bg-[#151924] border border-[#23293b] rounded-xl p-3 text-center">
          <p className="text-xs font-bold text-white">BSC Booking System</p>
          <p className="text-[10px] text-emerald-400 font-medium mt-0.5">● Live Firestore Sync</p>
        </div>
      </div>
    </aside>
  );
};
