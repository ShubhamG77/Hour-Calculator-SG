import React from 'react';
import { motion } from 'framer-motion';
import { 
  Palmtree, 
  ArrowRight, 
  HelpCircle, 
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { formatMinutes } from '../utils/timeUtils';

interface SimulatorPageProps {
  stats: any;
  setSimulatedLeaves: (hours: number) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  stats,
  setSimulatedLeaves,
}) => {
  const {
    remainingWeekdays,
    expectedMonthEndStatus,
    leaveUsedThisMonth,
    remainingLeaveBalance,
    remainingLeaveMinutes,
    
    // Simulated values
    simulatedLeaves,
    simulatedMonthEndStatus,
    simulatedShortageMinutes,
    simulatedLeaveUsed,
    simulatedLeaveBalance,
    simulatedLeaveMinutesRemaining
  } = stats;

  const currentShortageMinutes = expectedMonthEndStatus < 0 ? Math.abs(expectedMonthEndStatus) : 0;

  const handleSimulateSelect = (hours: number) => {
    setSimulatedLeaves(hours);
  };

  const handleCustomSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulatedLeaves(parseFloat(e.target.value) || 0);
  };

  // Recovery requirements for simulation
  const currentRecoveryMinutesDaily = remainingWeekdays > 0 ? Math.ceil(currentShortageMinutes / remainingWeekdays) : 0;
  const simulatedRecoveryMinutesDaily = remainingWeekdays > 0 ? Math.ceil(simulatedShortageMinutes / remainingWeekdays) : 0;

  return (
    <div className="space-y-6">
      {/* Simulator Control Widget */}
      <GlassCard className="p-6" hoverEffect={false}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-purple-500/15 rounded-lg text-purple-400 border border-purple-500/25">
            <Palmtree className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Leave Impact Simulator</h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Simulate taking planned leaves to immediately visualize how it affects your target hours shortage, 
          proportional leave usage, and the daily recovery time required for the remaining {remainingWeekdays} working days.
        </p>

        <div className="space-y-6">
          {/* Quick presets */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Select Leave Simulation Preset
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSimulateSelect(8)}
                className={`py-3.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                  simulatedLeaves === 8
                    ? 'bg-purple-500/25 border-purple-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌴 Full Leave (8h)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateSelect(4)}
                className={`py-3.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                  simulatedLeaves === 4
                    ? 'bg-purple-500/25 border-purple-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌗 Half Day (4h)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateSelect(6)}
                className={`py-3.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                  simulatedLeaves === 6
                    ? 'bg-purple-500/25 border-purple-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌘 3/4 Day (6h)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateSelect(0)}
                className={`py-3.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                  simulatedLeaves === 0
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🔄 Reset (0h)
              </button>
            </div>
          </div>

          {/* Slider custom selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulate Custom Leave Hours
              </span>
              <span className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                {simulatedLeaves}h 00m
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="40"
                step="4"
                value={simulatedLeaves}
                onChange={handleCustomSliderChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-1">
              <span>0h</span>
              <span>8h (1 day)</span>
              <span>16h (2 days)</span>
              <span>24h (3 days)</span>
              <span>32h (4 days)</span>
              <span>40h (5 days)</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Side by Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Current Projection */}
        <GlassCard className="p-6 relative overflow-hidden" hoverEffect={false}>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Clock className="w-24 h-24 text-slate-400" />
          </div>
          
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Current Projection
          </h4>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">Month-End Shortage</span>
              <p className="text-2xl font-extrabold text-white mt-0.5">
                {formatMinutes(currentShortageMinutes)}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium">Recovery Requirement</span>
              <p className="text-base font-bold text-slate-300 mt-0.5">
                {currentRecoveryMinutesDaily > 0 ? (
                  <>Stay <strong className="text-white font-bold">{currentRecoveryMinutesDaily}m</strong> extra daily</>
                ) : (
                  <span className="text-emerald-400 font-semibold">0m extra daily</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Leave Used</span>
                <p className="font-bold text-white mt-0.5">{leaveUsedThisMonth.toFixed(3)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Leave Balance</span>
                <p className={`font-bold mt-0.5 ${remainingLeaveBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {remainingLeaveBalance.toFixed(3)} ({formatMinutes(Math.round(remainingLeaveMinutes))})
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right Column: Simulated Projection */}
        <GlassCard className="p-6 relative overflow-hidden border-2 border-purple-500/30" hoverEffect={false}>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Palmtree className="w-24 h-24 text-purple-400" />
          </div>

          <div className="flex justify-between items-start mb-4">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Simulated Projection
            </h4>
            <span className="text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
              +{simulatedLeaves}h Leave
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">New Month-End Shortage</span>
              <p className="text-2xl font-extrabold text-purple-300 mt-0.5">
                {formatMinutes(simulatedShortageMinutes)}
              </p>
              {simulatedShortageMinutes > currentShortageMinutes && (
                <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
                  ⚠️ Added shortage: +{formatMinutes(simulatedShortageMinutes - currentShortageMinutes)}
                </span>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium">New Recovery Requirement</span>
              <p className="text-base font-bold text-purple-200 mt-0.5">
                {simulatedRecoveryMinutesDaily > 0 ? (
                  <>Stay <strong className="text-white font-bold">{simulatedRecoveryMinutesDaily}m</strong> extra daily</>
                ) : (
                  <span className="text-emerald-400 font-semibold">0m extra daily</span>
                )}
              </p>
              {simulatedRecoveryMinutesDaily > currentRecoveryMinutesDaily && (
                <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
                  📈 Daily extra needed increases by +{simulatedRecoveryMinutesDaily - currentRecoveryMinutesDaily}m
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-500/20 text-xs">
              <div>
                <span className="text-slate-500 font-medium">New Leave Used</span>
                <p className="font-bold text-purple-300 mt-0.5">{simulatedLeaveUsed.toFixed(3)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">New Leave Balance</span>
                <p className={`font-bold mt-0.5 ${simulatedLeaveBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulatedLeaveBalance.toFixed(3)} ({formatMinutes(Math.round(simulatedLeaveMinutesRemaining))})
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Simulator Insight banner */}
      {simulatedLeaves > 0 && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white">Simulator Insights</h5>
            <p className="mt-0.5 leading-relaxed">
              Adding {simulatedLeaves}h of simulated leave uses up <strong className="text-white">{(simulatedLeaves / 8.0).toFixed(3)} units</strong> from your base allocation. 
              {simulatedLeaveBalance < 0 ? (
                <span> This creates a leave deficit of <strong className="text-rose-300">{Math.abs(simulatedLeaveBalance).toFixed(3)}</strong>, which must be offset by worked hours recovery or salary deduction.</span>
              ) : (
                <span> You still retain a positive leave balance of <strong className="text-emerald-400">{simulatedLeaveBalance.toFixed(3)}</strong>.</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
