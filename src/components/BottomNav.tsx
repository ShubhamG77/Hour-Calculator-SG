import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Brain, 
  Palmtree, 
  BarChart3, 
  Settings as SettingsIcon,
  MoreHorizontal,
  X
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'Log', icon: Clock },
    { id: 'planner', label: 'Planner', icon: Brain },
    { id: 'simulator', label: 'Simulator', icon: Palmtree },
  ];

  const moreItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-lg border-t border-white/10 dark:border-white/5 px-3 pb-safe pt-2">
      <div className="flex justify-around items-center h-12 max-w-lg mx-auto">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !showMoreMenu;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full select-none"
              style={{ color: isActive ? '#34d399' : 'rgb(156, 163, 175)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  className="absolute -top-2 w-10 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="flex flex-col items-center justify-center flex-1 h-full select-none"
          style={{ color: showMoreMenu || moreItems.some(item => activeTab === item.id) ? '#34d399' : 'rgb(156, 163, 175)' }}
        >
          {moreItems.some(item => activeTab === item.id) && !showMoreMenu && (
            <motion.div
              layoutId="activeTabIndicatorMobile"
              className="absolute -top-2 w-10 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {showMoreMenu ? (
            <X className="w-5 h-5 text-emerald-400 animate-spin-slow" />
          ) : (
            <MoreHorizontal className={`w-5 h-5 ${moreItems.some(item => activeTab === item.id) ? 'text-emerald-400' : 'text-slate-400'}`} />
          )}
          <span className="text-[10px] font-semibold mt-0.5">More</span>
        </button>
      </div>

      {/* Floating Secondary Menu overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
            />
            {/* Menu options card */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-16 left-4 right-4 bg-slate-900/90 border border-white/10 dark:border-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl -z-10"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
                Analytics & Settings
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/10 border-emerald-500/35 text-white'
                          : 'bg-white/5 dark:bg-slate-950/40 border-white/10 dark:border-white/5 text-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
