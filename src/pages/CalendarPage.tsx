import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  X,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { 
  getCalendarGridDays, 
  isWeekend, 
  getDateString, 
  formatMinutes,
  parseTimeString 
} from '../utils/timeUtils';
import { DayLog } from '../hooks/useHoursTracker';

interface CalendarPageProps {
  logs: Record<string, DayLog>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  updateLog: (dateString: string, minutesWorked: number, isLeave: boolean, leaveHours: number, notes?: string) => void;
  deleteLog: (dateString: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  logs,
  selectedDate,
  setSelectedDate,
  updateLog,
  deleteLog,
}) => {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [hoursInput, setHoursInput] = useState<string>('8');
  const [minutesInput, setMinutesInput] = useState<string>('0');
  const [isLeave, setIsLeave] = useState<boolean>(false);
  const [leaveHours, setLeaveHours] = useState<number>(8);
  const [notes, setNotes] = useState<string>('');

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Grid dates
  const gridDays = getCalendarGridDays(currentYear, currentMonth);

  // Month navigation
  const prevMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Open modal to log time
  const handleDayClick = (date: Date) => {
    const key = getDateString(date);
    const existingLog = logs[key];
    
    setEditingDate(key);
    if (existingLog) {
      setIsLeave(existingLog.isLeave);
      setNotes(existingLog.notes || '');
      if (existingLog.isLeave) {
        setLeaveHours(existingLog.leaveHours);
        setHoursInput('0');
        setMinutesInput('0');
      } else {
        setLeaveHours(8);
        setHoursInput(String(Math.floor(existingLog.minutesWorked / 60)));
        setMinutesInput(String(existingLog.minutesWorked % 60));
      }
    } else {
      // Default presets
      setIsLeave(false);
      setLeaveHours(8);
      setNotes('');
      // If it is a weekday, default to 8h, if weekend default to 0h
      if (isWeekend(date)) {
        setHoursInput('0');
        setMinutesInput('0');
      } else {
        setHoursInput('8');
        setMinutesInput('0');
      }
    }
  };

  // Save log entry
  const handleSave = () => {
    if (!editingDate) return;
    
    const minutesWorked = (parseInt(hoursInput, 10) || 0) * 60 + (parseInt(minutesInput, 10) || 0);
    updateLog(editingDate, minutesWorked, isLeave, leaveHours, notes);
    setEditingDate(null);
  };

  // Delete log entry
  const handleDelete = () => {
    if (!editingDate) return;
    deleteLog(editingDate);
    setEditingDate(null);
  };

  // Color code calculation for calendar cells
  const getDayColorClass = (date: Date) => {
    const isCurrentMonth = date.getMonth() === currentMonth;
    if (!isCurrentMonth) {
      return 'opacity-20 pointer-events-none bg-slate-900/10 text-slate-600';
    }

    if (isWeekend(date)) {
      return 'bg-blue-900/20 border-blue-950/20 text-blue-300 dark:text-blue-400 hover:bg-blue-900/30';
    }

    const key = getDateString(date);
    const log = logs[key];

    if (!log) {
      // Unfilled weekday (counts as < 6h)
      return 'bg-rose-950/20 border-rose-950/30 text-rose-300/60 hover:bg-rose-950/30';
    }

    if (log.isLeave) {
      return 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900';
    }

    const mins = log.minutesWorked;
    if (mins >= 480) { // 8h or more
      return 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/55';
    } else if (mins >= 450) { // 7h 30m - 7h 59m
      return 'bg-amber-950/20 border-amber-900/30 text-amber-300 hover:bg-amber-950/35';
    } else if (mins >= 360) { // 6h - 7h 29m
      return 'bg-orange-950/25 border-orange-900/30 text-orange-300 hover:bg-orange-950/40';
    } else { // Below 6h
      return 'bg-rose-950/30 border-rose-900/40 text-rose-300 hover:bg-rose-950/50';
    }
  };

  // Emoji badges for visual key
  const getDotIndicator = (date: Date) => {
    if (date.getMonth() !== currentMonth) return null;
    if (isWeekend(date)) return <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />;
    
    const key = getDateString(date);
    const log = logs[key];
    if (!log) return <span className="w-1.5 h-1.5 rounded-full bg-rose-600/40" />;
    if (log.isLeave) return <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />;
    
    const mins = log.minutesWorked;
    if (mins >= 480) return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />;
    if (mins >= 450) return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
    if (mins >= 360) return <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with navigation */}
      <GlassCard className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-1 px-2">
          <span>{monthNames[currentMonth]}</span>
          <span className="text-slate-400 font-medium">{currentYear}</span>
        </h2>
        <div className="flex gap-1.5">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>

      {/* Main Calendar Card */}
      <GlassCard className="p-4" hoverEffect={false}>
        {/* Days of Week Label */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-xs font-bold text-slate-400 uppercase py-1 tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {gridDays.map((date, index) => {
            const dateStr = getDateString(date);
            const isToday = dateStr === getDateString(new Date(2026, 6, 14)); // July 14, 2026
            const log = logs[dateStr];
            
            return (
              <button
                key={index}
                onClick={() => handleDayClick(date)}
                className={`
                  relative flex flex-col justify-between items-start 
                  p-1.5 md:p-3 h-16 md:h-24 rounded-xl border text-left 
                  transition-all duration-200 select-none overflow-hidden
                  ${getDayColorClass(date)}
                  ${isToday ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950' : ''}
                `}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs md:text-sm font-bold">
                    {date.getDate()}
                  </span>
                  {getDotIndicator(date)}
                </div>

                {date.getMonth() === currentMonth && !isWeekend(date) && (
                  <div className="text-[10px] md:text-xs font-semibold mt-1">
                    {log ? (
                      log.isLeave ? (
                        <span className="text-slate-400">Leave ({log.leaveHours}h)</span>
                      ) : (
                        <span className="text-slate-200">{formatMinutes(log.minutesWorked)}</span>
                      )
                    ) : (
                      <span className="text-slate-500/80">0h 00m</span>
                    )}
                  </div>
                )}
                {isToday && (
                  <span className="absolute bottom-1 right-1 text-[8px] font-extrabold uppercase bg-emerald-400 text-slate-950 px-1 rounded-sm tracking-wider">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Color Code Legend */}
      <GlassCard className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-emerald-950/30 border border-emerald-900/40" />
          <span>🟢 &ge; 8h 00m completed</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-amber-950/20 border border-amber-900/30" />
          <span>🟡 7h 30m - 7h 59m</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-orange-950/25 border border-orange-900/30" />
          <span>🟠 6h 00m - 7h 29m</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-rose-950/30 border border-rose-900/40" />
          <span>🔴 Below 6h 00m</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-slate-950 border border-slate-800" />
          <span>⚫ Leave Taken</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 rounded bg-blue-900/20 border border-blue-950/20" />
          <span>🔵 Weekend Holiday</span>
        </div>
      </GlassCard>

      {/* Event Logging Dialog Modal */}
      <AnimatePresence>
        {editingDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDate(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-900/90 border border-white/10 dark:border-white/5 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                {/* Dialog Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Log Work Hours</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{editingDate}</p>
                  </div>
                  <button 
                    onClick={() => setEditingDate(null)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Dialog Body */}
                <div className="space-y-4 pt-2">
                  {/* Leave Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                    <label className="text-sm font-semibold text-slate-200 cursor-pointer" htmlFor="is-leave-check">
                      Mark as Leave (⚫)
                    </label>
                    <input 
                      type="checkbox"
                      id="is-leave-check"
                      checked={isLeave}
                      onChange={(e) => setIsLeave(e.target.checked)}
                      className="w-5 h-5 accent-emerald-400 cursor-pointer rounded"
                    />
                  </div>

                  {isLeave ? (
                    /* Leave details inputs */
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Leave Type & Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 8, label: 'Full Day (8h)' },
                          { val: 4, label: 'Half Day (4h)' },
                          { val: 6, label: '3/4 Day (6h)' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setLeaveHours(opt.val)}
                            className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                              leaveHours === opt.val
                                ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">Custom Leave Hours:</span>
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={leaveHours}
                          onChange={(e) => setLeaveHours(parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white text-center focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Standard hours work inputs */
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Worked Time
                      </label>
                      <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 flex-1">
                          <input 
                            type="number"
                            min="0"
                            max="23"
                            value={hoursInput}
                            onChange={(e) => setHoursInput(e.target.value)}
                            placeholder="0"
                            className="bg-transparent w-full text-center text-xl font-extrabold text-white focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 uppercase">Hours</span>
                        </div>
                        <div className="text-xl font-extrabold text-slate-600">:</div>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input 
                            type="number"
                            min="0"
                            max="59"
                            value={minutesInput}
                            onChange={(e) => setMinutesInput(e.target.value)}
                            placeholder="00"
                            className="bg-transparent w-full text-center text-xl font-extrabold text-white focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400 uppercase">Minutes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="notes-textarea">
                      Notes / Description
                    </label>
                    <textarea
                      id="notes-textarea"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g., release deploy, doctor visit, regular work"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dialog Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {logs[editingDate] && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-3.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Logs
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
