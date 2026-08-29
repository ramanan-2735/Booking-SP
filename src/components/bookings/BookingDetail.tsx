import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import {
  CalendarCheck,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlayCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const BookingDetail: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const {
    bookings,
    purchases,
    getClientStats,
    setActiveView,
    openBookingModal,
    openDeleteModal,
    updateBooking,
    navigateBack,
    googleUser,
    syncBookingToGoogleCalendar,
    deleteBookingFromGoogleCalendar,
    isCalendarSyncing,
    openCalendarModal,
  } = useApp();

  const [isLocalSyncing, setIsLocalSyncing] = useState(false);

  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Booking record not found.</p>
        <button
          onClick={navigateBack}
          className="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 font-bold text-sm"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const clientStats = getClientStats(booking.clientId);
  const relatedPurchase = booking.purchaseId ? purchases.find((p) => p.id === booking.purchaseId) : null;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleStatusChange = (newStatus: BookingStatus) => {
    updateBooking({
      ...booking,
      status: newStatus,
    });
  };

  const handleCalendarSync = async () => {
    setIsLocalSyncing(true);
    await syncBookingToGoogleCalendar(booking.id);
    setIsLocalSyncing(false);
  };

  const handleCalendarRemove = async () => {
    if (window.confirm(`Remove this event from Google Calendar? The local booking will remain intact.`)) {
      setIsLocalSyncing(true);
      await deleteBookingFromGoogleCalendar(booking.id);
      setIsLocalSyncing(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    }
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-4 py-4 space-y-5">
      {/* Top Card */}
      <div className="bg-[#161a25] border border-[#262c3e] rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {booking.id}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">{booking.clientName}</h2>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
                {booking.googleEventId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Google Calendar Synced
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openBookingModal(booking, booking.clientId, booking.purchaseId)}
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors"
              title="Edit Booking"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                openDeleteModal({
                  type: 'booking',
                  id: booking.id,
                  name: `${booking.clientName} (${booking.id})`,
                })
              }
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
              title="Delete Booking"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client quick link */}
        <div className="pt-3 border-t border-[#23293a] flex items-center justify-between text-xs text-gray-300">
          <button
            onClick={() => setActiveView({ type: 'client-detail', clientId: booking.clientId })}
            className="flex items-center gap-1.5 text-amber-400 hover:underline font-semibold"
          >
            <User className="w-3.5 h-3.5" />
            <span>Client: {booking.clientName} ({booking.clientId})</span>
          </button>
          {clientStats && (
            <span className="text-gray-400">
              Client Balance: <strong className="text-amber-400">{clientStats.hoursRemaining} hrs</strong>
            </span>
          )}
        </div>
      </div>

      {/* Google Calendar Sync Panel */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Google Calendar Sync
          </h3>
          {booking.googleEventId ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected Event
            </span>
          ) : (
            <span className="text-xs text-gray-500">Not synced yet</span>
          )}
        </div>

        <div className="bg-[#11141c] border border-[#212735] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">
              {booking.googleEventId ? 'Event scheduled in Google Calendar' : 'Sync session with your Google Calendar'}
            </p>
            <p className="text-[11px] text-gray-400">
              {booking.googleEventId
                ? `Event ID: ${booking.googleEventId.slice(0, 16)}...`
                : googleUser
                ? 'Click below to push this booking directly to your calendar'
                : 'Connect your Google account to enable 1-click calendar sync'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {booking.googleEventId ? (
              <>
                {booking.googleCalendarHtmlLink && (
                  <a
                    href={booking.googleCalendarHtmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#1e2434] hover:bg-[#272f44] text-xs font-bold text-gray-200 hover:text-white flex items-center gap-1.5 border border-[#2d374e] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open in Cal</span>
                  </a>
                )}
                <button
                  onClick={handleCalendarSync}
                  disabled={isLocalSyncing || isCalendarSyncing}
                  className="px-3 py-1.5 rounded-xl bg-[#1e2434] hover:bg-[#272f44] text-xs font-bold text-amber-400 flex items-center gap-1.5 border border-amber-400/30 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocalSyncing ? 'animate-spin' : ''}`} />
                  <span>Update</span>
                </button>
                <button
                  onClick={handleCalendarRemove}
                  disabled={isLocalSyncing || isCalendarSyncing}
                  className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 text-xs transition-colors"
                  title="Unlink from Calendar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : googleUser ? (
              <button
                onClick={handleCalendarSync}
                disabled={isLocalSyncing || isCalendarSyncing}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLocalSyncing ? 'Adding...' : 'Add to Google Calendar'}</span>
              </button>
            ) : (
              <button
                onClick={openCalendarModal}
                className="px-4 py-2 rounded-xl bg-[#202636] hover:bg-[#293246] text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Connect Google Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Grid */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Schedule & Duration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#12141d] border border-[#212634] p-3.5 rounded-xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Start Date</p>
              <p className="text-sm font-bold text-white mt-0.5">{formatDateDisplay(booking.startDate)}</p>
            </div>
          </div>

          <div className="bg-[#12141d] border border-[#212634] p-3.5 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Start Time</p>
              <p className="text-sm font-bold text-white mt-0.5">{booking.startTime}</p>
            </div>
          </div>

          <div className="bg-[#12141d] border border-[#212634] p-3.5 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Duration / Slots Used</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{booking.durationHours} Hours</p>
            </div>
          </div>

          <div className="bg-[#12141d] border border-[#212634] p-3.5 rounded-xl flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Related Session Purchase</p>
              {relatedPurchase ? (
                <button
                  onClick={() => setActiveView({ type: 'purchase-detail', purchaseId: relatedPurchase.id })}
                  className="text-sm font-bold text-purple-300 hover:underline mt-0.5 flex items-center gap-1"
                >
                  {relatedPurchase.id} ({relatedPurchase.hoursPurchased} hrs)
                </button>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Deducted from Client Balance</p>
              )}
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 font-semibold mb-1">Session Agenda / Notes</p>
            <p className="text-xs text-gray-300 bg-[#12141d] p-3 rounded-xl border border-[#212634] leading-relaxed">
              {booking.notes}
            </p>
          </div>
        )}
      </div>

      {/* Quick Status Update Bar */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-4 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Quick Status Change
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as BookingStatus[]).map((st) => {
            const isCurrent = booking.status === st;
            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isCurrent
                    ? 'bg-amber-400 text-gray-950 border-amber-400 shadow-md'
                    : 'bg-[#1b202c] text-gray-300 border-gray-700/70 hover:border-gray-500'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

