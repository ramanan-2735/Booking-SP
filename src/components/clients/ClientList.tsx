import React from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { Trash2, Edit3, ChevronRight, User, Plus, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const ClientList: React.FC = () => {
  const {
    clients,
    searchQuery,
    setActiveView,
    openClientModal,
    openDeleteModal,
    getClientStats,
  } = useApp();

  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      client.name.toLowerCase().includes(q) ||
      client.id.toLowerCase().includes(q) ||
      (client.phone && client.phone.toLowerCase().includes(q)) ||
      (client.email && client.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pb-28">
      {/* Header Info / Count Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-400 bg-[#151821]/60 border-b border-[#202533]">
        <span>Total Clients: <strong className="text-amber-400">{filteredClients.length}</strong></span>
        <span>Tap any client for full profile & history</span>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1b202c] border border-[#2a3144] flex items-center justify-center text-gray-500 mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No clients found</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-6">
            {searchQuery
              ? `No client matches "${searchQuery}". Try clearing search.`
              : 'Add your first client to start recording session packages and bookings.'}
          </p>
          <button
            onClick={() => openClientModal()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#202533]">
          {filteredClients.map((client) => {
            const stats = getClientStats(client.id);
            const remainingHours = stats ? stats.hoursRemaining : 0;
            const isLow = remainingHours <= 4 && remainingHours > 0;
            const isZeroOrNegative = remainingHours <= 0;

            return (
              <motion.div
                key={client.id}
                id={`client-row-${client.id}`}
                layout
                className="group px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#181d28]/70 active:bg-[#1b212e] transition-colors cursor-pointer"
                onClick={() => setActiveView({ type: 'client-detail', clientId: client.id })}
              >
                {/* Left: Name & ID */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {client.name}
                    </h3>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#222736] text-gray-300 border border-gray-700/60">
                      {client.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>Remaining:</span>
                      <span
                        className={`font-semibold ${
                          isZeroOrNegative
                            ? 'text-rose-400'
                            : isLow
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400'
                        }`}
                      >
                        {remainingHours} hrs
                      </span>
                    </span>
                    {stats && (
                      <span className="hidden sm:inline text-gray-400">
                        • {stats.bookingCount} bookings
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Delete Icon */}
                  <button
                    id={`delete-client-${client.id}`}
                    onClick={() =>
                      openDeleteModal({
                        type: 'client',
                        id: client.id,
                        name: client.name,
                      })
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    aria-label={`Delete ${client.name}`}
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Edit Icon */}
                  <button
                    id={`edit-client-${client.id}`}
                    onClick={() => openClientModal(client)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                    aria-label={`Edit ${client.name}`}
                    title="Edit Client"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Chevron Right */}
                  <div
                    onClick={() => setActiveView({ type: 'client-detail', clientId: client.id })}
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
