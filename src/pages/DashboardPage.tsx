import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Palmtree, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Share2,
  PlusCircle,
  Check,
  Calculator,
  Eraser
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { CountUp, CountUpMinutes } from '../components/CountUp';
import { formatMinutes, getGreeting, parsePastedHours } from '../utils/timeUtils';

interface DashboardPageProps {
  stats: any;
  settings: any;
  setActiveTab: (tab: string) => void;
  applyPastedHours: (entries: number[]) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  settings,
  setActiveTab,
  applyPastedHours,
}) => {
  const {
    totalWeekdays,
    completedWeekdays,
    remainingWeekdays,
    requiredMinutesTillToday,
    totalTargetMinutes,
    workedMinutesTillToday,
    leaveMinutesTillToday,
    completedMinutesTillToday,
    netMinutesStatus,
    isAhead,
    netMinutesStatusAbs,
    averageMinutesPerDay,
    projectedTotalMinutes,
    expectedMonthEndStatus,
    leaveUsedThisMonth,
    remainingLeaveBalance,
    remainingLeaveMinutes,
  } = stats;

  const [copied, setCopied] = useState(false);

  // Quick paste calculator state
  const [pasteInput, setPasteInput] = useState('');
  const [pasteResult, setPasteResult] = useState<ReturnType<typeof parsePastedHours> | null>(null);

  const dailyTargetMinutes = settings.dailyTargetMinutes || 480;

  const handleCalculatePaste = () => {
    const result = parsePastedHours(pasteInput, dailyTargetMinutes);
    setPasteResult(result);
    // Feed the parsed hours into the dashboard stats
    applyPastedHours(result.entries);
  };

  const handleClearPaste = () => {
    setPasteInput('');
    setPasteResult(null);
    // Also wipe all dashboard data
    applyPastedHours([]);
  };

  const greeting = getGreeting(settings.userName);

  // Calculate required extra minutes per day to break even if lagging
  const minutesNeededDailyToRecover = !isAhead && remainingWeekdays > 0
    ? Math.ceil(netMinutesStatusAbs / remainingWeekdays)
    : 0;

  // Percentage of required hours completed till today
  const completionPercentage = requiredMinutesTillToday > 0 
    ? Math.min(Math.round((completedMinutesTillToday / requiredMinutesTillToday) * 100), 150)
    : 0;

  const handleShare = () => {
    const reportText = `📊 Shubham Work Hours Tracker Summary (July 2026)

👤 Employee: ${settings.userName}
🟢 Completed Hours: ${formatMinutes(completedMinutesTillToday)} / ${formatMinutes(requiredMinutesTillToday)} required
📈 Current Status: ${isAhead ? '🟢 Ahead' : '🔴 Lagging'} by ${formatMinutes(netMinutesStatusAbs)}
📅 Month Progress: ${completedWeekdays} / ${totalWeekdays} working days
⏱️ Daily Work Average: ${formatMinutes(averageMinutesPerDay)}
🏖️ Leave Credit: ${remainingLeaveBalance.toFixed(3)} leaves (${formatMinutes(Math.round(remainingLeaveMinutes))} remaining)
🔮 Month-End Forecast: ${expectedMonthEndStatus >= 0 ? '🟢 Surplus' : '🔴 Shortage'} of ${formatMinutes(Math.abs(expectedMonthEndStatus))}

${isAhead ? '🎉 Back on track! Great job Shubham!' : `💪 Recovery requirement: Stay ${minutesNeededDailyToRecover}m extra daily for the remaining ${remainingWeekdays} working days.`}
    `;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Percentage of month completed (days)
  const monthProgressPercentage = totalWeekdays > 0
    ? Math.round((completedWeekdays / totalWeekdays) * 100)
    : 0;

  // Circular progress ring helper
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(completionPercentage, 100) / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Hello Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/80 via-teal-950/40 to-slate-900/80 dark:from-slate-950/80 dark:via-emerald-950/30 dark:to-slate-950/80 border border-white/10 dark:border-white/5 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20 pointer-events-none">
          <Sparkles className="w-24 h-24 text-emerald-400 animate-pulse-slow" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              {greeting}
            </h2>
            
            {/* Dynamic status line */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isAhead ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🟢 Ahead by {formatMinutes(netMinutesStatusAbs)} today 🚀
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  🔴 Lagging by {formatMinutes(netMinutesStatusAbs)} today ⚠️
                </span>
              )}

              <p className="text-xs md:text-sm text-slate-300 font-medium">
                {isAhead ? (
                  <span>Great job {settings.userName}! You're back on track 🎉</span>
                ) : (
                  <span>
                    {remainingWeekdays > 0 ? (
                      <>Only <span className="text-emerald-400 font-bold">{minutesNeededDailyToRecover}m</span> extra daily needed to finish strong 💪</>
                    ) : (
                      <>Month end reached. Try simulating leaves to manage shortage! 🏖</>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => setActiveTab('history')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs md:text-sm font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Log Hours
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs md:text-sm font-bold shadow-lg hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> Share Summary
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Paste Hours Calculator */}
      <GlassCard className="p-6" delay={0.03}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
            <Calculator className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Hours Calculator</h4>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Paste your daily hours below (e.g. <span className="text-slate-300">7 hrs, 30 min</span>). Each non-zero entry counts
          as one working day at a target of <span className="text-emerald-300 font-semibold">{formatMinutes(dailyTargetMinutes)}</span>.
        </p>

        <textarea
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          rows={4}
          placeholder={'7 hrs, 30 min   6 hrs, 40 min   7 hrs, 40 min   0 min\n8 hrs, 41 min   8 hrs, 8 min   5 hrs, 14 min   5 hrs, 50 min'}
          className="w-full rounded-xl bg-slate-900/60 border border-white/10 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/40 outline-none text-sm text-slate-100 font-mono p-3 resize-y placeholder:text-slate-600 transition-colors"
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleCalculatePaste}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs md:text-sm font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Calculator className="w-4 h-4" /> Calculate
          </button>
          <button
            onClick={handleClearPaste}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs md:text-sm font-bold shadow-lg hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            <Eraser className="w-4 h-4" /> Clear
          </button>
        </div>

        {pasteResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-5"
          >
            {pasteResult.workingDays === 0 ? (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>No valid hours found. Try a format like <strong>7 hrs, 30 min</strong> or <strong>8h 15m</strong>.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Working Days</span>
                    <p className="text-lg font-bold text-white mt-1">{pasteResult.workingDays}</p>
                  </div>
                  <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Worked</span>
                    <p className="text-lg font-bold text-emerald-400 mt-1">{formatMinutes(pasteResult.totalWorkedMinutes)}</p>
                  </div>
                  <div className="text-center bg-slate-900/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required</span>
                    <p className="text-lg font-bold text-slate-300 mt-1">{formatMinutes(pasteResult.requiredMinutes)}</p>
                  </div>
                </div>

                {pasteResult.netMinutes >= 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-base font-extrabold text-emerald-300">
                        🟢 Ahead by {pasteResult.netMinutes} Minutes
                      </p>
                      <p className="text-sm font-semibold text-emerald-400/90">
                        Ahead by {formatMinutes(pasteResult.netMinutes)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    <div>
                      <p className="text-base font-extrabold text-rose-300">
                        🔴 Lagging by {Math.abs(pasteResult.netMinutes)} Minutes
                      </p>
                      <p className="text-sm font-semibold text-rose-400/90">
                        Lagging by {formatMinutes(Math.abs(pasteResult.netMinutes))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </GlassCard>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours Card */}
        <GlassCard className="p-5 flex justify-between items-center" delay={0.05}>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Completed Hours</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              <CountUpMinutes endMinutes={completedMinutesTillToday} />
            </h3>
            <p className="text-xs text-slate-400">
              Required: <span className="text-slate-300 font-medium">{formatMinutes(requiredMinutesTillToday)}</span>
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="32" 
                cy="32" 
                r={radius} 
                className="stroke-slate-700/30" 
                strokeWidth="5" 
                fill="transparent" 
              />
              <motion.circle 
                cx="32" 
                cy="32" 
                r={radius} 
                className="stroke-emerald-400" 
                strokeWidth="5" 
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-[10px] font-bold text-white">
              <CountUp end={completionPercentage} />%
            </div>
          </div>
        </GlassCard>

        {/* Days Card */}
        <GlassCard className="p-5 flex justify-between items-center" delay={0.1}>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Working Days</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              <CountUp end={completedWeekdays} /> / <CountUp end={totalWeekdays} />
            </h3>
            <p className="text-xs text-slate-400">
              Remaining: <span className="text-emerald-400 font-semibold">{remainingWeekdays} days</span>
            </p>
          </div>
          <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
            <Calendar className="w-6 h-6 animate-pulse-slow" />
          </div>
        </GlassCard>

        {/* Average Card */}
        <GlassCard className="p-5 flex justify-between items-center" delay={0.15}>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Daily Average</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              <CountUpMinutes endMinutes={averageMinutesPerDay} />
            </h3>
            <p className="text-xs text-slate-400">
              Target: <span className="text-slate-300">8h 00m</span>
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </GlassCard>

        {/* Leave Card */}
        <GlassCard className="p-5 flex justify-between items-center" delay={0.2}>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Leave Credit</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              <CountUp end={remainingLeaveBalance} decimals={3} />
            </h3>
            <p className="text-xs text-slate-400">
              Eq. Hours: <span className={`${remainingLeaveMinutes >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold`}>{formatMinutes(Math.round(remainingLeaveMinutes))}</span>
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Palmtree className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Middle Section: Forecast and Forecast Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Card */}
        <GlassCard className="p-6 flex flex-col justify-between" delay={0.25}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Forecast</h4>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on your current daily average of <strong className="text-emerald-300 font-semibold">{formatMinutes(averageMinutesPerDay)}</strong>, 
              you are projected to complete <strong className="text-emerald-300 font-semibold">{formatMinutes(projectedTotalMinutes)}</strong> by month end 
              (against a target of {formatMinutes(totalTargetMinutes)}).
            </p>

            <div className="mt-6 space-y-3">
              {/* Target progress bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Projected Completion Rate</span>
                  <span>{Math.round((projectedTotalMinutes / totalTargetMinutes) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((projectedTotalMinutes / totalTargetMinutes) * 100, 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Month Progress (Days)</span>
                  <span>{monthProgressPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${monthProgressPercentage}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Month-End Balance Status</span>
              <p className={`text-base font-extrabold flex items-center gap-1 mt-0.5 ${expectedMonthEndStatus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {expectedMonthEndStatus >= 0 ? (
                  <>🟢 Surplus of {formatMinutes(expectedMonthEndStatus)}</>
                ) : (
                  <>🔴 Shortage of {formatMinutes(Math.abs(expectedMonthEndStatus))}</>
                )}
              </p>
            </div>
            
            {!isAhead && (
              <button 
                onClick={() => setActiveTab('planner')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
              >
                Open Recovery Plan <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

        {/* Leave Impact Card */}
        <GlassCard className="p-6 flex flex-col justify-between" delay={0.3}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-500/15 rounded-lg text-purple-400 border border-purple-500/25">
                <Palmtree className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Leave Impact Projection</h4>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Every month, you receive <strong className="text-white">1.0 leave (8h 00m)</strong>. At month end, any hours shortage is deducted proportionally 
              from your leave balance.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-900/30 rounded-xl p-4 border border-white/5">
              <div className="text-center py-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leave Used</span>
                <p className="text-lg font-bold text-white mt-1">
                  <CountUp end={leaveUsedThisMonth} decimals={3} />
                </p>
                <span className="text-xs text-slate-500">
                  {formatMinutes(Math.round(leaveUsedThisMonth * 480))}
                </span>
              </div>
              <div className="text-center py-1 border-l border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Remaining Balance</span>
                <p className={`text-lg font-bold mt-1 ${remainingLeaveBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <CountUp end={remainingLeaveBalance} decimals={3} />
                </p>
                <span className="text-xs text-slate-500">
                  {formatMinutes(Math.round(remainingLeaveMinutes))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
            {remainingLeaveBalance < 0 ? (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Warning:</strong> You are in a leave deficit. You must stay extra or simulate leaves to reconcile!
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>All Clear:</strong> Your projected hours are covered by your leave allocation.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
