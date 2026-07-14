import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Clock,
  Compass,
  Star,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { formatMinutes } from '../utils/timeUtils';

interface PlannerPageProps {
  stats: any;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ stats }) => {
  const {
    remainingWeekdays,
    netMinutesStatus,
    isAhead,
    netMinutesStatusAbs,
  } = stats;

  // Recovery Calculations
  const shortageMinutes = isAhead ? 0 : netMinutesStatusAbs;

  // Build a fixed-rate recovery plan capped to the ACTUAL remaining working days.
  // Any shortage that can't fit within the remaining days is converted to a leave deduction.
  const buildPlan = (rate: number) => {
    const daysNeeded = shortageMinutes > 0 ? Math.ceil(shortageMinutes / rate) : 0;
    const daysUsed = Math.min(daysNeeded, remainingWeekdays);
    const uncoveredMinutes = Math.max(0, shortageMinutes - remainingWeekdays * rate);
    const recoveredMinutes = Math.min(shortageMinutes, daysUsed * rate);
    const leaveDeducted = uncoveredMinutes / 480;
    return {
      rate,
      daysNeeded,
      daysUsed,
      uncoveredMinutes,
      recoveredMinutes,
      leaveDeducted,
      fullyRecoverable: uncoveredMinutes <= 0,
    };
  };

  const comfortable = buildPlan(20);
  const balanced = buildPlan(35);
  const fast = buildPlan(60);

  // Interactive custom recovery calculator (slider: 0 to 8 hours per day)
  const [extraPerDay, setExtraPerDay] = useState(60);
  const customDaysNeeded = shortageMinutes > 0 && extraPerDay > 0 ? Math.ceil(shortageMinutes / extraPerDay) : 0;
  const customCovered = extraPerDay > 0 && customDaysNeeded <= remainingWeekdays;
  const customDaysUsed = Math.min(customDaysNeeded, remainingWeekdays);
  const customUncoveredMinutes = Math.max(0, shortageMinutes - remainingWeekdays * extraPerDay);
  const customLeaveDeducted = customUncoveredMinutes / 480;

  // 4. Smart Mixed Plan: Stay 30m on some days, 1h on others
  // Let's divide shortage into blocks of 90m (60m + 30m)
  let mixedDays1h = 0;
  let mixedDays30m = 0;
  
  if (shortageMinutes > 0) {
    const blocksOf90 = Math.floor(shortageMinutes / 90);
    const rem = shortageMinutes % 90;
    
    mixedDays1h = blocksOf90;
    mixedDays30m = blocksOf90;
    
    if (rem > 0) {
      if (rem <= 30) {
        mixedDays30m += 1;
      } else if (rem <= 60) {
        mixedDays1h += 1;
      } else {
        mixedDays1h += 1;
        mixedDays30m += 1;
      }
    }
  }
  
  const mixedTotalDays = mixedDays1h + mixedDays30m;
  const mixedPossible = mixedTotalDays <= remainingWeekdays;

  // SVG Circular Meter Config
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // If they are ahead, percentage is 0. If lagging, map it relative to, say, 480 minutes (8h) target
  const maxLagValue = 960; // 16h max range for meter
  const shortagePercentage = Math.min(Math.round((shortageMinutes / maxLagValue) * 100), 100);
  const strokeDashoffset = circumference - (shortagePercentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header and Circular Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recovery Meter Card */}
        <GlassCard className="p-6 md:col-span-1 flex flex-col items-center justify-center text-center" hoverEffect={false}>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Recovery Meter
          </h3>

          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            {/* SVG Meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="stroke-slate-800" 
                strokeWidth="8" 
                fill="transparent" 
              />
              <motion.circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className={isAhead ? "stroke-emerald-400" : "stroke-rose-400"} 
                strokeWidth="8" 
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shortage</span>
              <span className={`text-xl font-extrabold ${isAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAhead ? '0h 00m' : formatMinutes(shortageMinutes)}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
            {isAhead ? (
              <span className="text-emerald-400 font-semibold">You have no hours deficit to recover! 🎉</span>
            ) : (
              <span>Calculated over your remaining <strong className="text-white">{remainingWeekdays} working days</strong>.</span>
            )}
          </p>
        </GlassCard>

        {/* Recovery Overview Description */}
        <GlassCard className="p-6 md:col-span-2 flex flex-col justify-between" hoverEffect={false}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Smart Recovery Planner</h3>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              If you have accumulated an hours deficit, the recovery planner splits the backlog into manageable daily blocks. 
              Review the generated plans below to choose the speed and comfort level that works best for your schedule.
            </p>

            {isAhead && (
              <div className="flex gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Fantastic work!</h4>
                  <p className="mt-0.5">You are ahead of your required work hours. No additional recovery is needed for July 2026.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining Weekdays</span>
              <p className="text-lg font-extrabold text-white mt-0.5">{remainingWeekdays} days</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recover Target</span>
              <p className="text-lg font-extrabold text-white mt-0.5">{formatMinutes(shortageMinutes)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Plan Details Grid */}
      {!isAhead && shortageMinutes > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Comfortable Plan */}
          <GlassCard className="p-5 flex flex-col justify-between border-l-4 border-l-emerald-500" delay={0.05}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Comfortable Plan
                </span>
                <span className={`text-[10px] font-bold uppercase ${comfortable.fullyRecoverable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {comfortable.fullyRecoverable ? '🟢 Achievable' : '🟡 Partial + Leave'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Stay <strong className="text-emerald-400 font-bold">20m extra</strong> daily for next <strong className="text-white font-bold">{comfortable.daysUsed}</strong> working days.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
              <span>Total recovery: {formatMinutes(comfortable.recoveredMinutes)}</span>
              {!comfortable.fullyRecoverable && (
                <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> {comfortable.leaveDeducted.toFixed(3)} leave deducted
                </span>
              )}
            </div>
          </GlassCard>

          {/* Balanced Plan */}
          <GlassCard className="p-5 flex flex-col justify-between border-l-4 border-l-amber-500" delay={0.1}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Balanced Plan
                </span>
                <span className={`text-[10px] font-bold uppercase ${balanced.fullyRecoverable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {balanced.fullyRecoverable ? '🟢 Achievable' : '🟡 Partial + Leave'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Stay <strong className="text-amber-400 font-bold">35m extra</strong> daily for next <strong className="text-white font-bold">{balanced.daysUsed}</strong> working days.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
              <span>Total recovery: {formatMinutes(balanced.recoveredMinutes)}</span>
              {!balanced.fullyRecoverable && (
                <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> {balanced.leaveDeducted.toFixed(3)} leave deducted
                </span>
              )}
            </div>
          </GlassCard>

          {/* Fast Recovery Plan */}
          <GlassCard className="p-5 flex flex-col justify-between border-l-4 border-l-rose-500" delay={0.15}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Fast Recovery Plan
                </span>
                <span className={`text-[10px] font-bold uppercase ${fast.fullyRecoverable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {fast.fullyRecoverable ? '🟢 Achievable' : '🟡 Partial + Leave'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Stay <strong className="text-rose-400 font-bold">1h (60m) extra</strong> daily for next <strong className="text-white font-bold">{fast.daysUsed}</strong> working days.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
              <span>Total recovery: {formatMinutes(fast.recoveredMinutes)}</span>
              {!fast.fullyRecoverable && (
                <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> {fast.leaveDeducted.toFixed(3)} leave deducted
                </span>
              )}
            </div>
          </GlassCard>

          {/* Smart Mixed Plan */}
          <GlassCard className="p-5 flex flex-col justify-between border-l-4 border-l-purple-500" delay={0.2}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                  ⭐ Smart Mixed Plan
                </span>
                <span className={`text-[10px] font-bold uppercase ${mixedPossible ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {mixedPossible ? '🟢 Achievable' : '🔴 Exceeds Month'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Stay <strong className="text-purple-400 font-bold">1h extra on {mixedDays1h} days</strong> and <strong className="text-indigo-400 font-bold">30m extra on {mixedDays30m} days</strong>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
              <span>Total schedule: {mixedTotalDays} working days</span>
              {!mixedPossible && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Exceeds remaining weekdays
                </span>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Custom Recovery Calculator (interactive slider) */}
      {!isAhead && shortageMinutes > 0 && (
        <GlassCard className="p-6" delay={0.25} hoverEffect={false}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-teal-500/15 rounded-lg text-teal-400 border border-teal-500/25">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Recovery Calculator</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Choose how much extra time you can stay each day (0 to 8 hours) and see how long it takes to clear your{' '}
            <strong className="text-white">{formatMinutes(shortageMinutes)}</strong> shortage. If it can't be covered within your remaining days, the leftover is deducted as leave.
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Extra time per day</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-sm font-bold border border-emerald-500/20">
              {formatMinutes(extraPerDay)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={480}
            step={15}
            value={extraPerDay}
            onChange={(e) => setExtraPerDay(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>0h</span>
            <span>4h</span>
            <span>8h</span>
          </div>

          {/* Result stats */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Days Needed</span>
              <p className="text-lg font-bold text-white mt-1">{extraPerDay > 0 ? `${customDaysNeeded} days` : '—'}</p>
            </div>
            <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Within Remaining</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{customDaysUsed} / {remainingWeekdays}</p>
            </div>
            <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leave Deducted</span>
              <p className={`text-lg font-bold mt-1 ${customLeaveDeducted > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {customLeaveDeducted.toFixed(3)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {customCovered ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <p>
                  Staying <strong>{formatMinutes(extraPerDay)} extra</strong> daily clears your shortage in <strong>{customDaysNeeded} working days</strong> — no leave deducted. 🎉
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  At <strong>{formatMinutes(extraPerDay)} extra</strong> daily you can only recover <strong>{formatMinutes(remainingWeekdays * extraPerDay)}</strong> across the remaining {remainingWeekdays} days.
                  The leftover <strong>{formatMinutes(customUncoveredMinutes)}</strong> will be deducted as <strong>{customLeaveDeducted.toFixed(3)} leave</strong>.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
