import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DeleteConfirmModal: React.FC = () => {
  const { deleteModalTarget, closeDeleteModal, confirmDelete } = useApp();

  if (!deleteModalTarget) return null;

  const getTitle = () => {
    switch (deleteModalTarget.type) {
      case 'client':
        return 'Delete Client Record';
      case 'purchase':
        return 'Delete Session Purchase';
      case 'booking':
        return 'Delete Booking Entry';
    }
  };

  const getDescription = () => {
    switch (deleteModalTarget.type) {
      case 'client':
        return `Are you sure you want to delete ${deleteModalTarget.name} (${deleteModalTarget.id})? All linked session purchases and bookings will also be removed.`;
      case 'purchase':
        return `Are you sure you want to delete Purchase ${deleteModalTarget.id} for ${deleteModalTarget.name}?`;
      case 'booking':
        return `Are you sure you want to delete Booking ${deleteModalTarget.id} for ${deleteModalTarget.name}? This will restore the client's session hours.`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDeleteModal}
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-[#161922] border border-[#2a2f3e] rounded-2xl p-6 shadow-2xl z-10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={closeDeleteModal}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{getTitle()}</h3>
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">{getDescription()}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={closeDeleteModal}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm bg-[#222736] hover:bg-[#2c3345] text-gray-200 border border-gray-700/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
