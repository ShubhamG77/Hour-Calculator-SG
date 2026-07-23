import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  BarChart3, 
  Brain, 
  Palmtree, 
  Settings as SettingsIcon,
  Sun,
  Moon
} from 'lucide-react';
import { Settings } from '../hooks/useHoursTracker';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  updateSettings,
}) => {
  const displayName = settings.userName || 'buddy';
  const profileInitial = displayName.charAt(0).toUpperCase();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Recovery Planner', icon: Brain },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'Hours History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'simulator', label: 'Leave Simulator', icon: Palmtree },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xl border-r border-white/10 dark:border-white/5 py-8 px-4 text-slate-200 z-30">
      {/* Brand Logo / Greeting */}
      <div className="px-4 mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
          SG Work
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-0.5">
          Hours Tracker
        </p>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 group focus:outline-none"
              style={{
                color: isActive
                  ? (settings.theme === 'dark' ? '#fff' : '#0f766e')
                  : 'rgb(100, 116, 139)'
              }}
            >
              {/* Active Tab Background Slide Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorDesktop"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/25 to-teal-500/10 border-l-2 border-emerald-400 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon className={`relative z-10 w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggler and Profile Summary */}
      <div className="pt-4 border-t border-white/10 dark:border-white/5 px-4 space-y-4">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/5 dark:bg-slate-900/40 hover:bg-white/10 dark:hover:bg-slate-900/60 border border-white/10 dark:border-white/5 transition-all duration-200 text-sm font-medium"
        >
          <span className="flex items-center text-slate-300">
            {settings.theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 mr-2 text-indigo-400" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 mr-2 text-amber-400" />
                Light Mode
              </>
            )}
          </span>
          <div className="w-8 h-4 bg-slate-700/60 rounded-full relative p-0.5 transition-colors">
            <motion.div 
              className="w-3 h-3 bg-white rounded-full"
              animate={{ x: settings.theme === 'dark' ? 16 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 text-lg">
            {profileInitial}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{displayName}</h4>
            <p className="text-xs text-slate-400">Regular Employee</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
