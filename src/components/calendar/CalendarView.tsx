import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  ExternalLink,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

export const CalendarView: React.FC = () => {
  const {
    bookings,
    clients,
    googleUser,
    openBookingModal,
    openCalendarModal,
    setActiveView,
    syncBookingToGoogleCalendar,
    isCalendarSyncing,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [syncingBookingId, setSyncingBookingId] = useState<string | null>(null);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const list = map.get(b.startDate) || [];
      list.push(b);
      map.set(b.startDate, list);
    });
    return map;
  }, [bookings]);

  // Selected date bookings
  const dayBookings = useMemo(() => {
    const list = bookingsByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [bookingsByDate, selectedDate]);

  // Calculate 7-day strip around selectedDate
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    // Find monday or start 3 days before
    const days: { dateStr: string; dayNum: number; dayName: string; count: number; isSelected: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const count = (bookingsByDate.get(str) || []).filter((b) => b.status !== 'Cancelled').length;
      days.push({
        dateStr: str,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString([], { weekday: 'short' }),
        count,
        isSelected: str === selectedDate,
        isToday: str === todayStr,
      });
    }
    return days;
  }, [selectedDate, bookingsByDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const handleSyncBooking = async (b: Booking) => {
    setSyncingBookingId(b.id);
    await syncBookingToGoogleCalendar(b.id);
    setSyncingBookingId(null);
  };

  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="pb-28 max-w-4xl mx-auto px-4 py-3 space-y-4">
      {/* Top Banner / Sync Info */}
      <div className="bg-[#161a26] border border-[#262c3e] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Session Calendar
              {googleUser ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Google Connected
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-bold">
                  Offline
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              Interactive timeline view synchronized with Google Calendar
            </p>
          </div>
        </div>

        <button
          onClick={openCalendarModal}
          className="px-3.5 py-2 rounded-xl bg-[#202738] hover:bg-[#283248] border border-[#2d374d] text-amber-400 text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Menu</span>
        </button>
      </div>

      {/* Date Carousel & Navigator */}
      <div className="bg-[#141722] border border-[#232838] rounded-2xl p-4 shadow-md space-y-3">
        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg bg-[#1b202c] hover:bg-[#242b3c] text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {formatDateTitle(selectedDate)}
            </h2>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg bg-[#1b202c] hover:bg-[#242b3c] text-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-[#1e2433] hover:bg-[#272f42] text-amber-400 border border-amber-400/30 transition-colors"
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-[#11141c] border border-[#272e40] text-xs text-white rounded-lg px-2 py-1 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* 7-day strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1">
          {weekDays.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                d.isSelected
                  ? 'bg-amber-400 text-gray-950 border-amber-400 font-extrabold shadow-md scale-102'
                  : d.isToday
                  ? 'bg-[#1e2536] text-white border-amber-400/50'
                  : 'bg-[#181d28] text-gray-400 border-transparent hover:border-[#2b3345]'
              }`}
            >
              <span className={`text-[10px] uppercase font-semibold ${d.isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                {d.dayName}
              </span>
              <span className={`text-sm sm:text-base font-bold mt-0.5 ${d.isSelected ? 'text-gray-950' : 'text-white'}`}>
                {d.dayNum}
              </span>
              {d.count > 0 && (
                <span
                  className={`mt-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    d.isSelected
                      ? 'bg-gray-950 text-amber-400'
                      : 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  }`}
                >
                  {d.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings on this Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Bookings for {formatDateTitle(selectedDate)} ({dayBookings.length})
          </h3>
          <button
            onClick={() => openBookingModal(undefined, undefined, undefined)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Booking</span>
          </button>
        </div>

        {dayBookings.length === 0 ? (
          <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-10 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-gray-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No sessions booked for this date</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              You have no client appointments scheduled on {formatDateTitle(selectedDate)}.
            </p>
            <button
              onClick={() => openBookingModal(undefined, undefined, undefined)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayBookings.map((b) => {
              const isSyncing = syncingBookingId === b.id || isCalendarSyncing;
              return (
                <motion.div
                  key={b.id}
                  layout
                  className="bg-[#161a26] border border-[#262c3e] hover:border-[#38425d] rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div
                    onClick={() => setActiveView({ type: 'booking-detail', bookingId: b.id })}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#212738] text-emerald-400 border border-emerald-500/20">
                        {b.id}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#1e2433] text-amber-300 border border-amber-500/30">
                        {b.courtName || 'Court 1'}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {b.clientName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{b.startTime}</span>
                        <span className="text-amber-400 font-semibold">({b.durationHours} hrs)</span>
                      </span>

                      {b.notes && (
                        <span className="text-gray-500 text-[11px] truncate max-w-xs">
                          {b.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Calendar Sync Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222838]">
                    {b.googleEventId ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Synced
                        </span>
                        {b.googleCalendarHtmlLink && (
                          <a
                            href={b.googleCalendarHtmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-[#202738] hover:bg-[#2a344a] text-gray-300 hover:text-white transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleSyncBooking(b)}
                          disabled={isSyncing}
                          className="p-2 rounded-xl bg-[#202738] hover:bg-[#2a344a] text-gray-300 hover:text-white transition-colors"
                          title="Re-sync event"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSyncBooking(b)}
                        disabled={!googleUser || isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-[#202738] hover:bg-[#2a344a] disabled:opacity-50 text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-amber-400/30 transition-colors"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Add to Google Cal</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
