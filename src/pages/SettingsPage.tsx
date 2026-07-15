import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Moon, 
  Sun, 
  Database,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Settings } from '../hooks/useHoursTracker';

interface SettingsPageProps {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  clearAllData: () => void;
  loadMockData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  updateSettings,
  clearAllData,
  loadMockData,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ userName: e.target.value });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateSettings({ theme });
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* settings main card */}
      <GlassCard className="p-6" hoverEffect={false}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Application Settings</h3>
        </div>

        <div className="space-y-5">
          {/* Profile Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5" htmlFor="username-input">
              <User className="w-4 h-4 text-slate-500" /> Greeter Name
            </label>
            <input
              id="username-input"
              type="text"
              value={settings.userName}
              onChange={handleNameChange}
              placeholder="Shubham"
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 block">
              This name is used for personalizations throughout the tracker views.
            </span>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Theme Mode
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  settings.theme === 'light'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-slate-900 dark:text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" /> Light Mode
              </button>
            </div>
          </div>

          {/* Target Hour Configuration Notice */}
          <div className="flex gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              Daily target work hours is fixed at <strong className="text-white">8h 00m</strong>. 
              Saturdays and Sundays are automatically excluded from calculations.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Database Management / Testing Card */}
      <GlassCard className="p-6" hoverEffect={false}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-500/15 rounded-lg text-blue-400 border border-blue-500/25">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation & Test Tools</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Use the quick-seed tool below to load sample logs from July 1 to July 14, 2026. This allows you to evaluate 
          the calendar color coding, recovery planner, forecast calculators, and charts with realistic mock logs.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={loadMockData}
            className="w-full py-3 bg-slate-800 border border-white/10 hover:bg-slate-700 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> Seed Demo Mock Data (July 2026)
          </button>
          
          <button
            type="button"
            onClick={clearAllData}
            className="w-full py-3 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/20 active:scale-[0.99] text-rose-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
          >
            <Trash2 className="w-4 h-4" /> Clear All Logs & Data
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
