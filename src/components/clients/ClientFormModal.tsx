import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Phone, Mail, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ClientFormModal: React.FC = () => {
  const {
    clientModalOpen,
    editingClient,
    closeClientModal,
    addClient,
    updateClient,
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstBookingDate, setFirstBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      setPhone(editingClient.phone || '');
      setEmail(editingClient.email || '');
      setFirstBookingDate(editingClient.firstBookingDate || '');
      setNotes(editingClient.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setFirstBookingDate('');
      setNotes('');
    }
    setError('');
  }, [editingClient, clientModalOpen]);

  if (!clientModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client Name is required');
      return;
    }

    if (editingClient) {
      updateClient({
        ...editingClient,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        firstBookingDate: firstBookingDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addClient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        firstBookingDate: firstBookingDate || undefined,
        notes: notes.trim() || undefined,
      });
    }
    closeClientModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeClientModal}
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
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  {editingClient ? `Edit ${editingClient.name}` : 'Add New Client'}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {editingClient ? editingClient.id : 'Auto-generated ID'}
                </p>
              </div>
            </div>
            <button
              onClick={closeClientModal}
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
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Client Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sujit Soman, Pradeep..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98450 11234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* First Time Booking Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                First Time Booking Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={firstBookingDate}
                  onChange={(e) => setFirstBookingDate(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Optional. Automatically set when first booking is added.</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Notes & Preferences
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  placeholder="e.g. VIP client, preferred timings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#11141c] border border-[#272e40] focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={closeClientModal}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-300 bg-[#222738] hover:bg-[#2a3045] border border-gray-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-lg shadow-amber-500/20 transition-colors"
              >
                {editingClient ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
