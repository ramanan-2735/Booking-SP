import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShoppingBag, User, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PurchaseFormModal: React.FC = () => {
  const {
    purchaseModalOpen,
    editingPurchase,
    defaultPurchaseClientId,
    closePurchaseModal,
    clients,
    addPurchase,
    updatePurchase,
    getClientStats,
  } = useApp();

  const [clientId, setClientId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [hoursPurchased, setHoursPurchased] = useState<number | ''>(20);
  const [ratePerHour, setRatePerHour] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPurchase) {
      setClientId(editingPurchase.clientId);
      setPurchaseDate(editingPurchase.purchaseDate);
      setHoursPurchased(editingPurchase.hoursPurchased);
      setRatePerHour(editingPurchase.ratePerHour || '');
      setNotes(editingPurchase.notes || '');
    } else {
      setClientId(defaultPurchaseClientId || (clients[0] ? clients[0].id : ''));
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setHoursPurchased(20);
      setRatePerHour('');
      setNotes('');
    }
    setError('');
  }, [editingPurchase, defaultPurchaseClientId, purchaseModalOpen, clients]);

  if (!purchaseModalOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientStats = clientId ? getClientStats(clientId) : null;

  const quickHours = [5, 10, 15, 20, 25, 26, 30, 50];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client');
      return;
    }
    if (!purchaseDate) {
      setError('Please choose a purchase date');
      return;
    }
    if (!hoursPurchased || Number(hoursPurchased) <= 0) {
      setError('Please enter a valid number of purchased hours');
      return;
    }

    const hours = Number(hoursPurchased);
    const rate = ratePerHour ? Number(ratePerHour) : undefined;
    const totalAmount = rate ? rate * hours : undefined;

    if (editingPurchase) {
      updatePurchase({
        ...editingPurchase,
        clientId,
        clientName: selectedClient ? selectedClient.name : editingPurchase.clientName,
        purchaseDate,
        hoursPurchased: hours,
        ratePerHour: rate,
        totalAmount,
        notes: notes.trim() || undefined,
      });
    } else {
      addPurchase({
        clientId,
        clientName: selectedClient ? selectedClient.name : 'Unknown Client',
        purchaseDate,
        hoursPurchased: hours,
        ratePerHour: rate,
        totalAmount,
        notes: notes.trim() || undefined,
      });
    }

    closePurchaseModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePurchaseModal}
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
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  {editingPurchase ? `Edit Purchase ${editingPurchase.id}` : 'Add Session Purchase'}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {editingPurchase ? editingPurchase.id : 'Auto-assigned Pur ID'}
                </p>
              </div>
            </div>
            <button
              onClick={closePurchaseModal}
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
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
              {clientStats && (
                <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                  <span>Current Balance: <strong className="text-amber-400">{clientStats.hoursRemaining} hrs</strong></span>
                  <span>Total Purchased: {clientStats.totalHoursPurchased} hrs</span>
                </p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Purchase Date <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Hours Purchased */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Hours / Slots Purchased <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  step="0.5"
                  placeholder="e.g. 20, 26, 30"
                  value={hoursPurchased}
                  onChange={(e) => setHoursPurchased(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Quick chip selection */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickHours.map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setHoursPurchased(hrs)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all ${
                      hoursPurchased === hrs
                        ? 'bg-amber-400 text-gray-950 border-amber-400'
                        : 'bg-[#1e2330] text-gray-300 border-[#2b3345] hover:border-gray-500'
                    }`}
                  >
                    +{hrs} hrs
                  </button>
                ))}
              </div>
            </div>

            {/* Rate & Optional notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Rate Per Hour (Optional)
              </label>
              <div className="relative">
                <span className="text-gray-500 text-sm font-bold absolute left-3.5 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="e.g. 1500"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
              {ratePerHour && hoursPurchased && (
                <p className="text-[11px] text-amber-400/90 mt-1 font-semibold">
                  Total Package Cost: ₹{(Number(ratePerHour) * Number(hoursPurchased)).toLocaleString()}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Package Description / Notes
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  placeholder="e.g. Phase 2 extension package, payment received via UPI..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={closePurchaseModal}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-300 bg-[#222738] hover:bg-[#2a3045] border border-gray-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-lg shadow-amber-500/20 transition-colors"
              >
                {editingPurchase ? 'Update Purchase' : 'Save Purchase'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
