import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Compass,
  Star,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { formatMinutes } from '../utils/timeUtils';

interface PlannerPageProps {
  stats: any;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ stats }) => {
  const {
    remainingWeekdays,
    isAhead,
    netMinutesStatusAbs,
  } = stats;

  // Recovery target in minutes
  const shortageMinutes = isAhead ? 0 : netMinutesStatusAbs;
  const maxExtraPerDayMinutes = 480;
  const minExtraPerDayToRecover =
    shortageMinutes > 0 && remainingWeekdays > 0
      ? Math.ceil(shortageMinutes / remainingWeekdays)
      : 0;
  const canRecoverWithoutLeave = minExtraPerDayToRecover <= maxExtraPerDayMinutes;

  const buildDynamicPlan = (title: string, dayRatio: number, tone: 'emerald' | 'amber' | 'rose') => {
    const daysPlanned = Math.max(1, Math.ceil(remainingWeekdays * dayRatio));
    const extraPerDay = Math.ceil(shortageMinutes / daysPlanned);
    const daysNeeded = extraPerDay > 0 ? Math.ceil(shortageMinutes / extraPerDay) : 0;

    return {
      title,
      tone,
      daysPlanned,
      extraPerDay,
      daysNeeded,
      totalRecoveryMinutes: shortageMinutes,
      isValid: extraPerDay <= maxExtraPerDayMinutes,
    };
  };

  const dynamicPlans = shortageMinutes > 0
    ? [
        buildDynamicPlan('Comfortable Plan', 1.0, 'emerald'),
        buildDynamicPlan('Balanced Plan', 0.7, 'amber'),
        buildDynamicPlan('Fast Recovery Plan', 0.45, 'rose'),
      ]
        .filter((plan) => plan.isValid)
    : [];

  const mixedBaseExtra = Math.max(minExtraPerDayToRecover, 30);
  const mixedBoostExtra = Math.min(maxExtraPerDayMinutes, mixedBaseExtra + 30);
  const mixedPlannedDays = shortageMinutes > 0
    ? Math.min(
        remainingWeekdays,
        Math.max(2, Math.ceil(shortageMinutes / Math.max(1, Math.floor((mixedBaseExtra + mixedBoostExtra) / 2)))),
      )
    : 0;
  const mixedBoostDays = mixedPlannedDays > 0 && mixedBoostExtra > mixedBaseExtra
    ? Math.max(0, Math.min(
        mixedPlannedDays,
        Math.ceil((shortageMinutes - mixedPlannedDays * mixedBaseExtra) / (mixedBoostExtra - mixedBaseExtra)),
      ))
    : 0;
  const mixedBaseDays = Math.max(0, mixedPlannedDays - mixedBoostDays);
  const mixedRecoveredMinutes = mixedBoostDays * mixedBoostExtra + mixedBaseDays * mixedBaseExtra;
  const mixedDaysNeeded = mixedPlannedDays;
  const mixedPlanValid = shortageMinutes > 0
    && mixedRecoveredMinutes >= shortageMinutes
    && mixedDaysNeeded <= remainingWeekdays
    && mixedBoostExtra <= maxExtraPerDayMinutes;

  // Custom recovery calculator: slider starts at 0, then user can increase to required level.
  const initialExtraPerDay = 0;
  const [extraPerDay, setExtraPerDay] = useState(initialExtraPerDay);
  const customDaysNeeded = shortageMinutes > 0 && extraPerDay > 0 ? Math.ceil(shortageMinutes / extraPerDay) : 0;
  const customRecoverableMinutes = remainingWeekdays * extraPerDay;
  const customUncoveredMinutes = Math.max(0, shortageMinutes - customRecoverableMinutes);
  const customLeaveImpact = customUncoveredMinutes / 480;
  const customCovered = extraPerDay >= minExtraPerDayToRecover && customDaysNeeded <= remainingWeekdays;

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
      {!isAhead && shortageMinutes > 0 && canRecoverWithoutLeave && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicPlans.map((plan, index) => {
            const toneStyles = {
              emerald: {
                border: 'border-l-emerald-500',
                chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                highlight: 'text-emerald-400',
              },
              amber: {
                border: 'border-l-amber-500',
                chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                highlight: 'text-amber-400',
              },
              rose: {
                border: 'border-l-rose-500',
                chip: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                highlight: 'text-rose-400',
              },
            } as const;

            const styles = toneStyles[plan.tone];

            return (
              <GlassCard
                key={plan.title}
                className={`p-5 flex flex-col justify-between border-l-4 ${styles.border}`}
                delay={0.05 + index * 0.05}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${styles.chip}`}>
                      {plan.title}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      Covers Fully
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Stay <strong className={`${styles.highlight} font-bold`}>{formatMinutes(plan.extraPerDay)} extra</strong> daily for{' '}
                    <strong className="text-white font-bold">{plan.daysNeeded}</strong> working days.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                  <span>Total recovery: {formatMinutes(plan.totalRecoveryMinutes)}</span>
                  <span className="text-emerald-400 font-semibold">No leave deduction</span>
                </div>
              </GlassCard>
            );
          })}

          {mixedPlanValid && (
            <GlassCard className="p-5 flex flex-col justify-between border-l-4 border-l-violet-500" delay={0.22}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase bg-violet-500/20 text-violet-300 border-violet-500/30">
                    <Star className="w-3 h-3" /> Smart Mixed Plan
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    Covers Fully
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Stay <strong className="text-violet-400 font-bold">{formatMinutes(mixedBoostExtra)} extra</strong> on{' '}
                  <strong className="text-white font-bold">{mixedBoostDays} days</strong> and{' '}
                  <strong className="text-indigo-400 font-bold">{formatMinutes(mixedBaseExtra)} extra</strong> on{' '}
                  <strong className="text-white font-bold">{mixedBaseDays} days</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                <span>Total schedule: {mixedDaysNeeded} working days</span>
                <span className="text-emerald-400 font-semibold">No leave deduction</span>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Not recoverable without leave */}
      {!isAhead && shortageMinutes > 0 && !canRecoverWithoutLeave && (
        <GlassCard className="p-5 border-l-4 border-l-rose-500" hoverEffect={false}>
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No no-leave plan can fully cover this month with current remaining days.</p>
              <p className="mt-1 text-rose-200/90">
                You need at least <strong>{formatMinutes(minExtraPerDayToRecover)}</strong> extra per day,
                which is above the planner limit of <strong>{formatMinutes(maxExtraPerDayMinutes)}</strong>.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Custom Recovery Calculator (interactive slider) */}
      {!isAhead && shortageMinutes > 0 && canRecoverWithoutLeave && (
        <GlassCard className="p-6" delay={0.25} hoverEffect={false}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-teal-500/15 rounded-lg text-teal-400 border border-teal-500/25">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Recovery Calculator</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Choose how much extra time you can stay each day and see how long it takes to clear your{' '}
            <strong className="text-white">{formatMinutes(shortageMinutes)}</strong> shortage. If extra time is too low,
            remaining shortage is shown as leave impact.
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
            max={maxExtraPerDayMinutes}
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
              <p className="text-lg font-bold text-emerald-400 mt-1">{customDaysNeeded} / {remainingWeekdays}</p>
            </div>
            <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leave Impact</span>
              <p className={`text-lg font-bold mt-1 ${customLeaveImpact > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {customLeaveImpact.toFixed(3)}
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
                  At <strong>{formatMinutes(extraPerDay)} extra</strong> daily, you can recover <strong>{formatMinutes(customRecoverableMinutes)}</strong> in {remainingWeekdays} days.
                  Remaining <strong>{formatMinutes(customUncoveredMinutes)}</strong> becomes <strong>{customLeaveImpact.toFixed(3)} leave</strong> impact.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
