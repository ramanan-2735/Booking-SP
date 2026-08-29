import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { GoogleCalendarEvent, GoogleCalendarItem } from '../../types';
import {
  X,
  Calendar,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  HelpCircle,
  CalendarCheck,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GoogleCalendarModal: React.FC = () => {
  const {
    calendarModalOpen,
    closeCalendarModal,
    googleUser,
    isCalendarSyncing,
    isCalendarLoading,
    selectedCalendarId,
    selectedCalendarName,
    setSelectedCalendarId,
    userCalendars,
    calendarEvents,
    lastCalendarSyncTime,
    autoSyncCalendar,
    setAutoSyncCalendar,
    fetchUserCalendars,
    fetchCalendarEvents,
    syncAllBookingsToGoogleCalendar,
    importEventsAsBookings,
    bookings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sync' | 'events' | 'settings'>('sync');
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [confirmBulkSync, setConfirmBulkSync] = useState(false);
  const [confirmBulkImport, setConfirmBulkImport] = useState(false);

  useEffect(() => {
    if (calendarModalOpen && googleUser) {
      setLoadingCalendars(true);
      fetchUserCalendars()
        .then(() => {
          fetchCalendarEvents();
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingCalendars(false));
    }
  }, [calendarModalOpen, googleUser]);

  if (!calendarModalOpen) return null;

  const activeBookingsCount = bookings.filter((b) => b.status !== 'Cancelled').length;
  const syncedBookingsCount = bookings.filter((b) => !!b.googleEventId).length;

  const handleToggleEventSelect = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEvents = () => {
    if (selectedEventIds.length === calendarEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(calendarEvents.map((e) => e.id));
    }
  };

  const handleExecuteBulkSync = async () => {
    setConfirmBulkSync(false);
    await syncAllBookingsToGoogleCalendar();
    await fetchCalendarEvents();
  };

  const handleExecuteImportSelected = async () => {
    setConfirmBulkImport(false);
    const toImport = calendarEvents.filter((e) => selectedEventIds.includes(e.id));
    await importEventsAsBookings(toImport);
    setSelectedEventIds([]);
  };

  const handleExecuteImportAll = async () => {
    setConfirmBulkImport(false);
    await importEventsAsBookings(calendarEvents);
  };

  const formatDateDisplay = (event: GoogleCalendarEvent) => {
    if (event.start?.dateTime) {
      const d = new Date(event.start.dateTime);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (event.start?.date) {
      return `${event.start.date} (All day)`;
    }
    return 'Unscheduled';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCalendarModal}
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#141824] border border-[#262c3e] rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#23293a] flex items-center justify-between bg-[#161a27]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                  Google Calendar Sync
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-md border border-amber-400/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Manage sessions & schedule sync with your Google Calendar
                </p>
              </div>
            </div>
            <button
              onClick={closeCalendarModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-[#23293a] bg-[#12151f] px-5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'sync'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Feed ({calendarEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Calendar Settings</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Google Account Status Banner */}
            <div className="bg-[#191e2b] border border-[#272e40] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-gray-300">Google Account</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {googleUser ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {googleUser.email || googleUser.displayName}
                    </span>
                  ) : (
                    'Connect your Google account to enable live calendar sync'
                  )}
                </p>
              </div>
              <GoogleSignInButton />
            </div>

            {/* Main Tabs */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                {/* Status overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-[#171b26] border border-[#252b3b] p-3 rounded-xl">
                    <span className="text-[11px] text-gray-400 block">Total Active Bookings</span>
                    <span className="text-lg font-extrabold text-white">{activeBookingsCount}</span>
                  </div>
                  <div className="bg-[#171b26] border border-[#252b3b] p-3 rounded-xl">
                    <span className="text-[11px] text-gray-400 block">Calendar Synced</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {syncedBookingsCount} / {activeBookingsCount}
                    </span>
                  </div>
                  <div className="bg-[#171b26] border border-[#252b3b] p-3 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-gray-400 block">Last Synced</span>
                    <span className="text-xs font-semibold text-amber-400">
                      {lastCalendarSyncTime ? `${lastCalendarSyncTime}` : 'Not yet synced'}
                    </span>
                  </div>
                </div>

                {/* Target Calendar Selector */}
                <div className="bg-[#171b26] border border-[#252b3b] p-4 rounded-xl space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Target Google Calendar
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCalendarId}
                      onChange={(e) => {
                        const cal = userCalendars.find((c) => c.id === e.target.value);
                        setSelectedCalendarId(e.target.value, cal?.summary || e.target.value);
                      }}
                      disabled={!googleUser || isCalendarLoading}
                      className="flex-1 bg-[#10131a] border border-[#262c3d] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    >
                      <option value="primary">Primary Calendar ({googleUser?.email || 'default'})</option>
                      {userCalendars
                        .filter((c) => c.id !== 'primary')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.summary} {c.primary ? '(Primary)' : ''}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={async () => {
                        await fetchUserCalendars();
                        await fetchCalendarEvents();
                      }}
                      disabled={!googleUser || isCalendarLoading}
                      className="p-2.5 rounded-xl bg-[#202636] hover:bg-[#283044] border border-[#2c354a] text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                      title="Refresh Calendars"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCalendarLoading ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Bookings will be exported as events into <strong>{selectedCalendarName}</strong>.
                  </p>
                </div>

                {/* Sync Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  {/* Push Bookings */}
                  <div className="bg-[#171b26] border border-[#252b3b] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ArrowUpFromLine className="w-4 h-4 text-amber-400" />
                        Push Bookings to Calendar
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Syncs all active scheduled bookings ({activeBookingsCount} bookings) to Google Calendar.
                      </p>
                    </div>

                    <button
                      onClick={() => setConfirmBulkSync(true)}
                      disabled={!googleUser || isCalendarSyncing || activeBookingsCount === 0}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-gray-800 disabled:text-gray-500 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all shrink-0 cursor-pointer"
                    >
                      {isCalendarSyncing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Push All Bookings</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pull Events */}
                  <div className="bg-[#171b26] border border-[#252b3b] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                        Import from Google Calendar
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pull upcoming events from Google Calendar and convert them into client session bookings.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('events')}
                      disabled={!googleUser}
                      className="px-4 py-2.5 rounded-xl bg-[#202738] hover:bg-[#283248] disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs flex items-center justify-center gap-2 border border-[#2d374d] transition-all shrink-0 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Review & Import ({calendarEvents.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Events Feed Tab */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Found <strong>{calendarEvents.length}</strong> event(s) in active calendar.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllEvents}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      {selectedEventIds.length === calendarEvents.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => fetchCalendarEvents()}
                      disabled={isCalendarLoading}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCalendarLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {calendarEvents.length === 0 ? (
                  <div className="p-8 text-center bg-[#171b26] border border-[#252b3b] rounded-xl">
                    <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No upcoming events found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {googleUser
                        ? 'There are no events on this calendar for the next 30 days.'
                        : 'Sign in to fetch events from your calendar.'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {calendarEvents.map((ev) => {
                      const isLinked = bookings.some((b) => b.googleEventId === ev.id);
                      const isSelected = selectedEventIds.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => !isLinked && handleToggleEventSelect(ev.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isLinked
                              ? 'bg-[#151922] border-[#222736] opacity-75'
                              : isSelected
                              ? 'bg-[#1d2433] border-amber-400/60'
                              : 'bg-[#171b26] border-[#252b3b] hover:border-[#374158] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected || isLinked}
                              disabled={isLinked}
                              onChange={() => handleToggleEventSelect(ev.id)}
                              className="mt-1 rounded accent-amber-400"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {ev.summary || '(Untitled Event)'}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {formatDateDisplay(ev)}
                              </p>
                              {ev.description && (
                                <p className="text-[10px] text-gray-500 truncate max-w-xs mt-0.5">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isLinked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Synced
                              </span>
                            ) : null}
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                                title="Open in Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Import Action */}
                {selectedEventIds.length > 0 && (
                  <div className="pt-2 flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                    <span className="text-xs text-amber-300 font-semibold">
                      {selectedEventIds.length} event(s) selected
                    </span>
                    <button
                      onClick={() => setConfirmBulkImport(true)}
                      className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs shadow-md"
                    >
                      Import Selected as Bookings
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-[#171b26] border border-[#252b3b] p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Preferences
                  </h4>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-[#1f2535]">
                    <div>
                      <p className="text-xs font-bold text-white">Auto-sync on Booking Creation</p>
                      <p className="text-[11px] text-gray-400">
                        Automatically create a Google Calendar event when you add or update bookings.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSyncCalendar}
                      onChange={(e) => setAutoSyncCalendar(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="bg-[#151822] border border-[#232938] p-4 rounded-xl flex items-start gap-3 text-xs text-gray-400">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-300">About Google Calendar Sync</p>
                    <p className="leading-relaxed">
                      All booking schedules include the client name, booking ID, duration, and agenda notes in the event details. Modifying or deleting bookings in the app will update or remove corresponding calendar entries when synced.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#23293a] bg-[#161a27] flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
              Google Calendar API v3
            </span>
            <button
              onClick={closeCalendarModal}
              className="px-4 py-2 rounded-xl bg-[#222738] hover:bg-[#2b3248] text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>

        {/* Confirmation Modal for Bulk Sync */}
        <AnimatePresence>
          {confirmBulkSync && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#171c28] border border-[#2c354a] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Sync Bookings to Calendar?</h4>
                    <p className="text-xs text-gray-400">
                      This will export {activeBookingsCount} bookings to &ldquo;{selectedCalendarName}&rdquo;.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setConfirmBulkSync(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-300 bg-[#222838]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteBulkSync}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-400 text-gray-950"
                  >
                    Confirm & Sync
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal for Bulk Import */}
        <AnimatePresence>
          {confirmBulkImport && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#171c28] border border-[#2c354a] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Import Calendar Events?</h4>
                    <p className="text-xs text-gray-400">
                      Import {selectedEventIds.length} event(s) as new client session bookings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setConfirmBulkImport(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-300 bg-[#222838]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteImportSelected}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-gray-950"
                  >
                    Confirm & Import
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
