import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  ShoppingBag,
  Plus,
  ArrowLeft,
  Trash2,
  Edit3,
  ChevronRight,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { motion } from 'motion/react';

export const ClientDetail: React.FC<{ clientId: string }> = ({ clientId }) => {
  const {
    getClientStats,
    setActiveView,
    openClientModal,
    openPurchaseModal,
    openBookingModal,
    openDeleteModal,
    navigateBack,
  } = useApp();

  const stats = getClientStats(clientId);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Client not found or has been deleted.</p>
        <button
          onClick={navigateBack}
          className="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 font-bold text-sm"
        >
          Back to Client List
        </button>
      </div>
    );
  }

  const {
    client,
    totalHoursPurchased,
    totalSlotsUsed,
    hoursRemaining,
    firstBookingDate,
    relatedPurchases,
    relatedBookings,
  } = stats;

  const isLowHours = hoursRemaining <= 4 && hoursRemaining > 0;
  const isZeroHours = hoursRemaining <= 0;

  // Format date helper
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-4 py-4 space-y-5">
      {/* Top Client Header Card */}
      <div className="bg-[#161a25] border border-[#262c3e] rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">{client.name}</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#222738] text-amber-400 border border-amber-500/30">
                  {client.id}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>First Time Booking Date:</span>
                <strong className="text-gray-200 font-semibold">{formatDateDisplay(firstBookingDate)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openClientModal(client)}
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors"
              title="Edit Client Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                openDeleteModal({
                  type: 'client',
                  id: client.id,
                  name: client.name,
                })
              }
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contact/Notes info if present */}
        {(client.phone || client.email || client.notes) && (
          <div className="pt-3 border-t border-[#23293a] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.notes && (
              <div className="sm:col-span-2 flex items-start gap-2 text-gray-400 italic">
                <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                <span>{client.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics Calculation Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-1">
          Session Balance & Usage
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Total Hours Purchased */}
          <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-medium">Purchased</span>
              <ShoppingBag className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalHoursPurchased}</p>
              <p className="text-[11px] text-gray-500 font-medium">Total Hours</p>
            </div>
          </div>

          {/* Total Slots Used */}
          <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-medium">Slots Used</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalSlotsUsed}</p>
              <p className="text-[11px] text-gray-500 font-medium">Hours Utilized</p>
            </div>
          </div>

          {/* Hours Remaining */}
          <div
            className={`rounded-2xl p-3 sm:p-4 flex flex-col justify-between border ${
              isZeroHours
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                : isLowHours
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold">Remaining</span>
              {isZeroHours ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <p
                className={`text-xl sm:text-2xl font-black ${
                  isZeroHours ? 'text-rose-400' : isLowHours ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {hoursRemaining}
              </p>
              <p className="text-[11px] font-semibold opacity-80">Hours Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Session Purchases Section */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">Related Session Purchases</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202638] text-gray-300 border border-gray-700">
              {relatedPurchases.length}
            </span>
          </div>
          <button
            id={`add-purchase-for-${client.id}`}
            onClick={() => openPurchaseModal(undefined, client.id)}
            className="px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Purchase
          </button>
        </div>

        {relatedPurchases.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 bg-[#12141c] rounded-xl border border-[#1e2330]">
            No purchases logged for this client yet.
          </div>
        ) : (
          <div className="divide-y divide-[#202533] border border-[#202533] rounded-xl overflow-hidden bg-[#12151e]">
            {relatedPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-[#181d28] transition-colors"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setActiveView({ type: 'purchase-detail', purchaseId: purchase.id })}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      {purchase.id}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {purchase.hoursPurchased} Hours
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Purchased on {formatDateDisplay(purchase.purchaseDate)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPurchaseModal(purchase, client.id)}
                    className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-800"
                    title="Edit Purchase"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      openDeleteModal({
                        type: 'purchase',
                        id: purchase.id,
                        name: client.name,
                      })
                    }
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30"
                    title="Delete Purchase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveView({ type: 'purchase-detail', purchaseId: purchase.id })}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Bookings Section */}
      <div className="bg-[#151924] border border-[#242a3c] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">Related Bookings</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#202638] text-gray-300 border border-gray-700">
              {relatedBookings.length}
            </span>
          </div>
          <button
            id={`add-booking-for-${client.id}`}
            onClick={() => openBookingModal(undefined, client.id)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Booking
          </button>
        </div>

        {relatedBookings.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 bg-[#12141c] rounded-xl border border-[#1e2330]">
            No bookings recorded for this client yet.
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
                    <span className="text-amber-400 font-medium">{booking.durationHours} hrs duration</span>
                    <span>•</span>
                    <span
                      className={`font-medium ${
                        booking.status === 'Completed'
                          ? 'text-emerald-400'
                          : booking.status === 'Scheduled'
                          ? 'text-blue-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openBookingModal(booking, client.id)}
                    className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-800"
                    title="Edit Booking"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      openDeleteModal({
                        type: 'booking',
                        id: booking.id,
                        name: client.name,
                      })
                    }
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30"
                    title="Delete Booking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveView({ type: 'booking-detail', bookingId: booking.id })}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
