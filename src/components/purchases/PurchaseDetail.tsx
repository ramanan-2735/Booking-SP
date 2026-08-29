import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Clock,
  Calendar,
  User,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';

export const PurchaseDetail: React.FC<{ purchaseId: string }> = ({ purchaseId }) => {
  const {
    getPurchaseStats,
    setActiveView,
    openPurchaseModal,
    openBookingModal,
    openDeleteModal,
    navigateBack,
  } = useApp();

  const stats = getPurchaseStats(purchaseId);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Purchase record not found.</p>
        <button
          onClick={navigateBack}
          className="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 font-bold text-sm"
        >
          Back to Purchases
        </button>
      </div>
    );
  }

  const { purchase, slotsUsed, hoursRemaining, relatedBookings } = stats;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    return dateStr;
  };

  const isZero = hoursRemaining <= 0;
  const isLow = hoursRemaining > 0 && hoursRemaining <= 4;

  return (
    <div className="pb-28 max-w-3xl mx-auto px-4 py-4 space-y-5">
      {/* Header Card */}
      <div className="bg-[#161a25] border border-[#262c3e] rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-400/15 text-amber-400 border border-amber-500/30">
                  {purchase.id}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">{purchase.clientName}</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>Purchase Date:</span>
                <strong className="text-gray-200 font-semibold">{formatDateDisplay(purchase.purchaseDate)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openPurchaseModal(purchase, purchase.clientId)}
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors"
              title="Edit Purchase"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                openDeleteModal({
                  type: 'purchase',
                  id: purchase.id,
                  name: purchase.clientName,
                })
              }
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
              title="Delete Purchase"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client Link & Rates */}
        <div className="pt-3 border-t border-[#23293a] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
          <button
            onClick={() => setActiveView({ type: 'client-detail', clientId: purchase.clientId })}
            className="flex items-center gap-1.5 text-amber-400 hover:underline font-semibold"
          >
            <User className="w-3.5 h-3.5" />
            <span>View Client ({purchase.clientId})</span>
          </button>

          {purchase.ratePerHour && (
            <span className="text-gray-400">
              Rate: <strong className="text-gray-200">₹{purchase.ratePerHour}/hr</strong>
              {purchase.totalAmount ? ` (Total: ₹${purchase.totalAmount.toLocaleString()})` : ''}
            </span>
          )}
        </div>

        {purchase.notes && (
          <p className="text-xs text-gray-400 italic mt-2.5 pt-2.5 border-t border-[#202533] flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
            <span>{purchase.notes}</span>
          </p>
        )}
      </div>

      {/* Stats Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-1">
          Package Allocation
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Hours Purchased */}
          <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-3.5 sm:p-4">
            <span className="text-xs text-gray-400 font-medium">Purchased</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{purchase.hoursPurchased}</p>
            <p className="text-[11px] text-gray-500">Total Hours</p>
          </div>

          {/* Slots Used */}
          <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-3.5 sm:p-4">
            <span className="text-xs text-gray-400 font-medium">Slots Used</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{slotsUsed}</p>
            <p className="text-[11px] text-gray-500">Booked Hours</p>
          </div>

          {/* Hours Remaining */}
          <div
            className={`rounded-2xl p-3.5 sm:p-4 border ${
              isZero
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                : isLow
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold">Remaining</span>
              {isZero ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <p
              className={`text-xl sm:text-2xl font-black ${
                isZero ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {hoursRemaining}
            </p>
            <p className="text-[11px] font-semibold opacity-80">Hours Left</p>
          </div>
        </div>
      </div>

      {/* Related Bookings */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">Linked Bookings</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202638] text-gray-300 border border-gray-700">
              {relatedBookings.length}
            </span>
          </div>
          <button
            onClick={() => openBookingModal(undefined, purchase.clientId, purchase.id)}
            className="px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Booking
          </button>
        </div>

        {relatedBookings.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 bg-[#12141c] rounded-xl border border-[#1e2330]">
            No bookings directly tagged to this purchase ID yet.
          </div>
        ) : (
          <div className="divide-y divide-[#202533] border border-[#202533] rounded-xl overflow-hidden bg-[#12151e]">
            {relatedBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-[#181d28] transition-colors"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setActiveView({ type: 'booking-detail', bookingId: booking.id })}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                      {booking.id}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {formatDateDisplay(booking.startDate)} • {booking.startTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="text-amber-400 font-medium">{booking.durationHours} hrs</span>
                    <span>•</span>
                    <span className="text-gray-300">{booking.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView({ type: 'booking-detail', bookingId: booking.id })}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
