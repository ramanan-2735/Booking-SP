import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';
import { motion } from 'motion/react';

export const BookingList: React.FC = () => {
  const {
    bookings,
    searchQuery,
    setActiveView,
    openBookingModal,
    openDeleteModal,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!matchesStatus) return false;
    if (!q) return true;
    return (
      booking.clientName.toLowerCase().includes(q) ||
      booking.id.toLowerCase().includes(q) ||
      booking.clientId.toLowerCase().includes(q) ||
      booking.startDate.includes(q) ||
      (booking.startTime && booking.startTime.toLowerCase().includes(q))
    );
  });

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Scheduled':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="pb-28">
      {/* Quick Filter bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-400 bg-[#151821]/60 border-b border-[#202533] overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {(['ALL', 'Scheduled', 'Completed', 'In Progress'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                statusFilter === st
                  ? 'bg-amber-400 text-gray-950 font-bold'
                  : 'bg-[#1b202c] text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-gray-500">
          Total: <strong className="text-amber-400">{filteredBookings.length}</strong>
        </span>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1b202c] border border-[#2a3144] flex items-center justify-center text-gray-500 mb-4">
            <CalendarCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No bookings found</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-6">
            {searchQuery
              ? `No booking matches "${searchQuery}". Try clearing search or filters.`
              : 'Schedule or record client session bookings.'}
          </p>
          <button
            onClick={() => openBookingModal()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBookings.map((booking) => (
            <motion.div
              key={booking.id}
              id={`booking-row-${booking.id}`}
              layout
              className="group p-4 bg-[#161a25] border border-[#232838] hover:border-amber-400/50 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm"
              onClick={() => setActiveView({ type: 'booking-detail', bookingId: booking.id })}
            >
              {/* Left: Client name & Booking ID */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {booking.clientName}
                  </h3>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#222736] text-emerald-400 border border-emerald-500/20">
                    {booking.id}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1e2433] text-amber-300 border border-amber-500/30">
                    {booking.courtName || 'Court 1'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1 text-gray-300 font-medium">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span>{formatDateDisplay(booking.startDate)}</span>
                    <span className="text-gray-500">•</span>
                    <span>{booking.startTime}</span>
                  </span>

                  <span className="text-amber-400 font-semibold">
                    ({booking.durationHours} hrs)
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${getStatusBadge(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {/* Delete Icon */}
                <button
                  id={`delete-booking-${booking.id}`}
                  onClick={() =>
                    openDeleteModal({
                      type: 'booking',
                      id: booking.id,
                      name: `${booking.clientName} (${booking.id})`,
                    })
                  }
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  aria-label={`Delete ${booking.id}`}
                  title="Delete Booking"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Edit Icon */}
                <button
                  id={`edit-booking-${booking.id}`}
                  onClick={() => openBookingModal(booking, booking.clientId, booking.purchaseId)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                  aria-label={`Edit ${booking.id}`}
                  title="Edit Booking"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Chevron Right */}
                <div
                  onClick={() => setActiveView({ type: 'booking-detail', bookingId: booking.id })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-amber-400 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
