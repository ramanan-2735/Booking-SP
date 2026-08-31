import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import {
  X,
  CalendarCheck,
  User,
  Calendar,
  Clock,
  ShoppingBag,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BookingFormModal: React.FC = () => {
  const {
    bookingModalOpen,
    editingBooking,
    defaultBookingClientId,
    defaultBookingPurchaseId,
    closeBookingModal,
    clients,
    purchases,
    bookings,
    courts,
    addBooking,
    updateBooking,
    getClientStats,
    googleUser,
    syncBookingToGoogleCalendar,
    autoSyncCalendar,
  } = useApp();

  const [clientId, setClientId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [courtId, setCourtId] = useState('court-1');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [durationHours, setDurationHours] = useState<number | ''>(4);
  const [status, setStatus] = useState<BookingStatus>('Scheduled');
  const [notes, setNotes] = useState('');
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [error, setError] = useState('');

  const activeCourts = courts.length > 0 ? courts.filter((c) => c.isActive) : [];

  useEffect(() => {
    if (editingBooking) {
      setClientId(editingBooking.clientId);
      setPurchaseId(editingBooking.purchaseId || '');
      setCourtId(editingBooking.courtId || (activeCourts[0] ? activeCourts[0].id : 'court-1'));
      setStartDate(editingBooking.startDate);
      setStartTime(editingBooking.startTime);
      setDurationHours(editingBooking.durationHours);
      setStatus(editingBooking.status);
      setNotes(editingBooking.notes || '');
      setSyncToCalendar(!!editingBooking.googleEventId);
    } else {
      setClientId(defaultBookingClientId || (clients[0] ? clients[0].id : ''));
      setPurchaseId(defaultBookingPurchaseId || '');
      setCourtId(activeCourts[0] ? activeCourts[0].id : 'court-1');
      setStartDate(new Date().toISOString().slice(0, 10));
      setStartTime('09:00 AM');
      setDurationHours(4);
      setStatus('Scheduled');
      setNotes('');
      setSyncToCalendar(autoSyncCalendar || !!googleUser);
    }
    setError('');
  }, [editingBooking, defaultBookingClientId, defaultBookingPurchaseId, bookingModalOpen, clients, googleUser, autoSyncCalendar]);

  if (!bookingModalOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientStats = clientId ? getClientStats(clientId) : null;
  const clientPurchases = clientId ? purchases.filter((p) => p.clientId === clientId) : [];

  // Duration chips
  const quickDurations = [1, 2, 4, 5, 6, 8, 10];
  const commonTimes = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  // Check balance
  const remainingHours = clientStats ? clientStats.hoursRemaining : 0;
  const currentDuration = Number(durationHours) || 0;
  
  // If editing, add back current booking duration to test against balance
  const effectiveRemaining = editingBooking && editingBooking.clientId === clientId && editingBooking.status !== 'Cancelled'
    ? remainingHours + editingBooking.durationHours
    : remainingHours;

  const isExceedingBalance = status !== 'Cancelled' && currentDuration > effectiveRemaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client');
      return;
    }
    if (!startDate) {
      setError('Please choose a start date');
      return;
    }
    if (!startTime.trim()) {
      setError('Please specify start time');
      return;
    }
    if (!durationHours || Number(durationHours) <= 0) {
      setError('Please enter valid duration in hours');
      return;
    }

    const duration = Number(durationHours);

    const selectedCourt = courts.find((c) => c.id === courtId);
    const courtName = selectedCourt ? selectedCourt.name : 'Court 1';

    if (editingBooking) {
      const res = await updateBooking({
        ...editingBooking,
        clientId,
        clientName: selectedClient ? selectedClient.name : editingBooking.clientName,
        purchaseId: purchaseId || undefined,
        courtId,
        courtName,
        startDate,
        startTime,
        durationHours: duration,
        status,
        notes: notes.trim() || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (syncToCalendar && googleUser) {
        syncBookingToGoogleCalendar(editingBooking.id);
      }
    } else {
      const res = await addBooking({
        clientId,
        clientName: selectedClient ? selectedClient.name : 'Unknown',
        purchaseId: purchaseId || undefined,
        courtId,
        courtName,
        startDate,
        startTime,
        durationHours: duration,
        status,
        notes: notes.trim() || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.booking && syncToCalendar && googleUser) {
        syncBookingToGoogleCalendar(res.booking.id);
      }
    }

    closeBookingModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeBookingModal}
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#161a25] border border-[#262c3e] rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  {editingBooking ? `Edit Booking ${editingBooking.id}` : 'Schedule New Booking'}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {editingBooking ? editingBooking.id : 'Auto-assigned BK ID'}
                </p>
              </div>
            </div>
            <button
              onClick={closeBookingModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Insufficient balance alert */}
          {isExceedingBalance && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Insufficient Client Session Hours</p>
                <p className="opacity-90">
                  Client only has {effectiveRemaining} hours remaining, but this booking requests {currentDuration} hours. (Deficit: {currentDuration - effectiveRemaining} hrs)
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Client <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setPurchaseId(''); // reset linked purchase
                  }}
                  required
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select client</option>
                  {clients.map((c) => {
                    const st = getClientStats(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id}) — {st ? `${st.hoursRemaining} hrs balance` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Court Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Badminton Court <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  required
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors appearance-none cursor-pointer font-bold"
                >
                  {activeCourts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} (Court #{court.number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Start Date <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Start Time <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Quick Time presets */}
            <div className="flex flex-wrap gap-1">
              {commonTimes.slice(0, 5).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStartTime(t)}
                  className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                    startTime === t
                      ? 'bg-emerald-500 text-gray-950 font-bold border-emerald-500'
                      : 'bg-[#181d28] text-gray-400 border-[#262c3e] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Duration / Slots Used */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Duration / Slots Used (Hours) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="0.5"
                  max="48"
                  step="0.5"
                  placeholder="e.g. 4, 8, 10"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Duration Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickDurations.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDurationHours(dur)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all ${
                      durationHours === dur
                        ? 'bg-amber-400 text-gray-950 border-amber-400'
                        : 'bg-[#1e2330] text-gray-300 border-[#2b3345] hover:border-gray-500'
                    }`}
                  >
                    {dur} hrs
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Booking Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as BookingStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      status === st
                        ? 'bg-amber-400 text-gray-950 font-bold border-amber-400'
                        : 'bg-[#12141c] text-gray-400 border-[#252b3b] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Link to Specific Purchase Package */}
            {clientPurchases.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Link to Session Purchase (Optional)
                </label>
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={purchaseId}
                    onChange={(e) => setPurchaseId(e.target.value)}
                    className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">General Client Balance</option>
                    {clientPurchases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} — {p.hoursPurchased} hrs ({p.purchaseDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Agenda / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Session Agenda / Notes
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  placeholder="e.g. Deep dive module, strategy session, workshop..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Google Calendar Sync Option */}
            <div className="bg-[#12151e] border border-[#232838] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Sync with Google Calendar</p>
                  <p className="text-[10px] text-gray-400">
                    {googleUser ? 'Creates/updates an event in your calendar' : 'Requires Google sign in'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={syncToCalendar}
                onChange={(e) => setSyncToCalendar(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={closeBookingModal}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-300 bg-[#222738] hover:bg-[#2a3045] border border-gray-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-lg shadow-amber-500/20 transition-colors"
              >
                {editingBooking ? 'Update Booking' : 'Schedule Booking'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
