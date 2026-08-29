import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Edit3, ChevronRight, ShoppingBag, Plus, Clock, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export const PurchaseList: React.FC = () => {
  const {
    purchases,
    searchQuery,
    setActiveView,
    openPurchaseModal,
    openDeleteModal,
    getPurchaseStats,
  } = useApp();

  const filteredPurchases = purchases.filter((purchase) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      purchase.clientName.toLowerCase().includes(q) ||
      purchase.id.toLowerCase().includes(q) ||
      purchase.clientId.toLowerCase().includes(q) ||
      purchase.purchaseDate.includes(q)
    );
  });

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
    <div className="pb-28">
      {/* Header Info Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-400 bg-[#151821]/60 border-b border-[#202533]">
        <span>Total Purchases: <strong className="text-amber-400">{filteredPurchases.length}</strong></span>
        <span>Tap purchase for usage details</span>
      </div>

      {/* List */}
      {filteredPurchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1b202c] border border-[#2a3144] flex items-center justify-center text-gray-500 mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No purchases found</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-6">
            {searchQuery
              ? `No purchase matches "${searchQuery}". Try clearing search.`
              : 'Add session packages and hours purchased by your clients.'}
          </p>
          <button
            onClick={() => openPurchaseModal()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Purchase
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#202533]">
          {filteredPurchases.map((purchase) => {
            const stats = getPurchaseStats(purchase.id);
            const remaining = stats ? stats.hoursRemaining : purchase.hoursPurchased;

            return (
              <motion.div
                key={purchase.id}
                id={`purchase-row-${purchase.id}`}
                layout
                className="group px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#181d28]/70 active:bg-[#1b212e] transition-colors cursor-pointer"
                onClick={() => setActiveView({ type: 'purchase-detail', purchaseId: purchase.id })}
              >
                {/* Left: Client name & Purchase ID */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {purchase.clientName}
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#222736] text-amber-400 border border-amber-500/20">
                      {purchase.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-semibold text-gray-200">
                      {purchase.hoursPurchased} Hours
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span>{formatDateDisplay(purchase.purchaseDate)}</span>
                    </span>
                    <span className="hidden sm:flex items-center gap-1 text-emerald-400 font-medium">
                      <span>({remaining} left)</span>
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Delete Icon */}
                  <button
                    id={`delete-purchase-${purchase.id}`}
                    onClick={() =>
                      openDeleteModal({
                        type: 'purchase',
                        id: purchase.id,
                        name: purchase.clientName,
                      })
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    aria-label={`Delete ${purchase.id}`}
                    title="Delete Purchase"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Edit Icon */}
                  <button
                    id={`edit-purchase-${purchase.id}`}
                    onClick={() => openPurchaseModal(purchase, purchase.clientId)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                    aria-label={`Edit ${purchase.id}`}
                    title="Edit Purchase"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Chevron Right */}
                  <div
                    onClick={() => setActiveView({ type: 'purchase-detail', purchaseId: purchase.id })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-amber-400 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
