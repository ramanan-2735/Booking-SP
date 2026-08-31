import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { Users, ShoppingBag, CalendarCheck, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, clients, purchases, bookings } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count: number }[] = [
    {
      id: 'master',
      label: 'Master',
      icon: Users,
      count: clients.length,
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: ShoppingBag,
      count: purchases.length,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarCheck,
      count: bookings.length,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarDays,
      count: bookings.filter((b) => b.status !== 'Cancelled').length,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#12151e]/95 backdrop-blur-md border-t border-[#222736] shadow-2xl safe-area-pb md:hidden"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all select-none ${
                isActive ? 'text-amber-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute -top-1 w-10 sm:w-12 h-1 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                      isActive
                        ? 'bg-amber-400 text-gray-950 shadow-xs'
                        : 'bg-[#222738] text-gray-300 border border-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
