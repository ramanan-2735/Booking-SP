import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  RotateCcw,
  Download,
  Upload,
  Calendar,
  Users,
  Clock,
  ShoppingBag,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAllDataToExcel } from '../../utils/excelExport';

export const DrawerMenu: React.FC = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    clients,
    purchases,
    bookings,
    getClientStats,
    resetToSampleData,
    exportDataJSON,
    importDataJSON,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPurchasedHours = purchases.reduce(
    (acc, p) => acc + (Number(p.hoursPurchased) || 0),
    0
  );
  const totalUsedSlots = bookings
    .filter((b) => b.status !== 'Cancelled')
    .reduce((acc, b) => acc + (Number(b.durationHours) || 0), 0);
  const totalRemainingHours = totalPurchasedHours - totalUsedSlots;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-80 max-w-[85vw] h-full bg-[#13161f] border-r border-[#232838] shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="p-5 border-b border-[#232838] flex items-center justify-between bg-[#161a25]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-lg">
                    BSC
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base leading-tight">BSC Booking</h2>
                    <p className="text-xs text-amber-400 font-medium">Court & Pass Manager</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Overview */}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  System Overview
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#1b202c] border border-[#262c3e] p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Clients</span>
                    </div>
                    <p className="text-lg font-bold text-white">{clients.length}</p>
                  </div>
                  <div className="bg-[#1b202c] border border-[#262c3e] p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bookings</span>
                    </div>
                    <p className="text-lg font-bold text-white">{bookings.length}</p>
                  </div>
                  <div className="bg-[#1b202c] border border-[#262c3e] p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                      <span>Purchased</span>
                    </div>
                    <p className="text-lg font-bold text-white">{totalPurchasedHours} hrs</p>
                  </div>
                  <div className="bg-[#1b202c] border border-amber-500/30 bg-amber-500/5 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remaining</span>
                    </div>
                    <p className="text-lg font-bold text-amber-400">{totalRemainingHours} hrs</p>
                  </div>
                </div>
              </div>

              {/* Excel Export & Data Actions */}
              <div className="px-5 py-2 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Data Reports & Backup
                </p>

                {/* Download Excel Button */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    exportAllDataToExcel(clients, purchases, bookings, getClientStats);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Export Excel (.xlsx)
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Clients, Passes & Bookings
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Download
                  </span>
                </button>

                <div className="space-y-1.5">
                  <button
                    onClick={exportDataJSON}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-gray-200 hover:text-white bg-[#1b202c] hover:bg-[#232938] border border-[#262c3e] transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Export Backup (JSON)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-gray-200 hover:text-white bg-[#1b202c] hover:bg-[#232938] border border-[#262c3e] transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Import Backup (JSON)</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <button
                    onClick={() => {
                      if (window.confirm('Reset all clients, purchases and bookings back to the original sample dataset?')) {
                        resetToSampleData();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-rose-300 hover:text-rose-200 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-800/40 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Reset to Sample Data</span>
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-5">
                <div className="bg-[#171a24] border border-[#252b3b] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Hours remaining are automatically deducted from client balances whenever a booking is created or completed.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#232838] flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Offline Persistent Storage
              </span>
              <span>v1.2.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
