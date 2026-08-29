import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const FAB: React.FC = () => {
  const {
    activeTab,
    activeView,
    openClientModal,
    openPurchaseModal,
    openBookingModal,
  } = useApp();

  const handleFabClick = () => {
    if (activeView.type === 'client-detail') {
      // In client detail view, default to add booking for this client
      openBookingModal(undefined, activeView.clientId);
    } else if (activeView.type === 'purchase-detail') {
      openBookingModal(undefined, undefined, activeView.purchaseId);
    } else {
      switch (activeTab) {
        case 'master':
          openClientModal();
          break;
        case 'purchases':
          openPurchaseModal();
          break;
        case 'bookings':
          openBookingModal();
          break;
      }
    }
  };

  const getLabel = () => {
    if (activeView.type === 'client-detail') return 'Add Booking';
    if (activeTab === 'master') return 'Add Client';
    if (activeTab === 'purchases') return 'Add Purchase';
    return 'Add Booking';
  };

  return (
    <motion.button
      id="main-fab-button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleFabClick}
      title={getLabel()}
      className="fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold shadow-xl shadow-amber-500/25 flex items-center justify-center border border-amber-300 transition-colors focus:outline-none focus:ring-4 focus:ring-amber-500/30"
      aria-label={getLabel()}
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </motion.button>
  );
};
