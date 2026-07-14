import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clipboard, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  Check, 
  Info,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { 
  getDateString, 
  formatMinutes, 
  parsePastedAttendance, 
  ParsedAttendanceResult 
} from '../utils/timeUtils';
import { DayLog } from '../hooks/useHoursTracker';

interface HistoryPageProps {
  logs: Record<string, DayLog>;
  updateLog: (dateString: string, minutesWorked: number, isLeave: boolean, leaveHours: number, notes?: string) => void;
  deleteLog: (dateString: string) => void;
  selectedDate: Date;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  logs,
  updateLog,
  deleteLog,
  selectedDate,
}) => {
  // Manual Entry State
  const [manualDate, setManualDate] = useState<string>(() => getDateString(new Date(2026, 6, 14))); // July 14, 2026
  const [manualHours, setManualHours] = useState<string>('8');
  const [manualMinutes, setManualMinutes] = useState<string>('0');
  const [manualIsLeave, setManualIsLeave] = useState<boolean>(false);
  const [manualLeaveHours, setManualLeaveHours] = useState<number>(8);
  const [manualNotes, setManualNotes] = useState<string>('');

  // Paste Portal State
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedResults, setParsedResults] = useState<ParsedAttendanceResult[]>([]);
  const [selectedImports, setSelectedImports] = useState<Record<string, boolean>>({});
  const [baseDateInput, setBaseDateInput] = useState<string>(() => getDateString(new Date(2026, 6, 1))); // Default to start of July

  // Manual entry submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = (parseInt(manualHours, 10) || 0) * 60 + (parseInt(manualMinutes, 10) || 0);
    updateLog(manualDate, minutes, manualIsLeave, manualLeaveHours, manualNotes);
    
    // Reset inputs
    setManualNotes('');
    setManualHours('8');
    setManualMinutes('0');
  };

  // Parse raw pasted text
  const handleParse = () => {
    if (!pastedText.trim()) return;
    const baseDate = new Date(baseDateInput);
    const parsed = parsePastedAttendance(pastedText, baseDate);
    
    setParsedResults(parsed);
    
    // Select all parsed entries by default
    const initialSelections: Record<string, boolean> = {};
    parsed.forEach((item, idx) => {
      initialSelections[idx] = true;
    });
    setSelectedImports(initialSelections);
  };

  // Toggle selection for import
  const toggleSelection = (index: number) => {
    setSelectedImports(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Import selected parsed logs
  const handleImport = () => {
    let importCount = 0;
    parsedResults.forEach((item, idx) => {
      if (selectedImports[idx]) {
        updateLog(item.dateString, item.minutesParsed, false, 0, `Imported from Portal: "${item.originalText}"`);
        importCount++;
      }
    });

    // Reset paste state
    setPastedText('');
    setParsedResults([]);
    setSelectedImports({});
  };

  // Sorted list of saved logs
  const sortedLogs = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manual Daily Log Form */}
        <GlassCard className="p-6 h-fit" hoverEffect={false}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Manual Daily Hours Log</h3>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="manual-date-input">
                  Date
                </label>
                <input
                  type="date"
                  id="manual-date-input"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="manual-is-leave-check">
                  Type
                </label>
                <select
                  id="manual-is-leave-check"
                  value={manualIsLeave ? 'leave' : 'work'}
                  onChange={(e) => setManualIsLeave(e.target.value === 'leave')}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="work">🟢 Work Day</option>
                  <option value="leave">⚫ Leave Day</option>
                </select>
              </div>
            </div>

            {manualIsLeave ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Leave Duration
                </label>
                <div className="flex gap-2">
                  {[
                    { val: 8, label: 'Full Day (8h)' },
                    { val: 4, label: 'Half Day (4h)' },
                    { val: 6, label: '3/4 Day (6h)' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setManualLeaveHours(opt.val)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        manualLeaveHours === opt.val
                          ? 'bg-emerald-500/25 border-emerald-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="manual-hours-input">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    id="manual-hours-input"
                    min="0"
                    max="23"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="manual-mins-input">
                    Minutes Worked
                  </label>
                  <input
                    type="number"
                    id="manual-mins-input"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none text-center"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="manual-notes-textarea">
                Notes
              </label>
              <input
                type="text"
                id="manual-notes-textarea"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="E.g. standard day, client demo"
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Save Log Entry
            </button>
          </form>
        </GlassCard>

        {/* Paste Attendance Logs Panel */}
        <GlassCard className="p-6 h-fit" hoverEffect={false}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-500/15 rounded-lg text-purple-400 border border-purple-500/25">
              <Clipboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paste Office Portal Attendance</h3>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 items-center text-xs text-slate-400 bg-white/5 border border-white/10 p-3 rounded-xl">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p>
                Paste your timesheet text containing logs (e.g. 7h 30m, 8h 41m, 07:30). 
                The parser skips weekends automatically and loads entries sequentially.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="base-date-input-val">
                Base Date (First Weekday)
              </label>
              <input
                type="date"
                id="base-date-input-val"
                value={baseDateInput}
                onChange={(e) => setBaseDateInput(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="portal-logs-pasted">
                Pasted Attendance Text
              </label>
              <textarea
                id="portal-logs-pasted"
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="7h 30m&#10;6h 40m&#10;7h 40m&#10;8h 41m&#10;5h 14m"
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleParse}
              className="w-full py-2.5 bg-slate-800 border border-white/10 hover:bg-slate-700 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              Parse Attendance Data
            </button>
          </div>

          {/* Parsed Logs Preview */}
          <AnimatePresence>
            {parsedResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10 dark:border-white/5 space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Parsed Results ({parsedResults.length} days found)
                </h4>
                
                <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950/40 rounded-xl border border-white/5 p-2 scrollbar-thin">
                  {parsedResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleSelection(idx)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          selectedImports[idx]
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-600 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-300 font-medium">{item.dateString}</span>
                      </div>
                      <div className="flex gap-3 text-[11px] items-center">
                        <span className="text-slate-500 italic max-w-[120px] truncate">"{item.originalText}"</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {formatMinutes(item.minutesParsed)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleImport}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 transition-all text-xs"
                >
                  Import Selected Logs
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Log History list */}
      <GlassCard className="p-6" hoverEffect={false}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Logged Hours History</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
              {sortedLogs.length} logs
            </span>
          </h3>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-2 border border-dashed border-white/10 rounded-xl bg-white/5">
            <AlertCircle className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-400">No work hour logs found.</p>
            <p className="text-xs text-slate-600">Enter hours manually or paste logs from your portal above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full border-collapse text-left text-xs md:text-sm text-slate-300">
              <thead>
                <tr className="bg-slate-900/60 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status / Type</th>
                  <th className="py-3 px-4">Hours Logged</th>
                  <th className="py-3 px-4 hidden md:table-cell">Notes</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => {
                  return (
                    <tr 
                      key={log.date} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        {log.date}
                      </td>
                      <td className="py-3 px-4">
                        {log.isLeave ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                            ⚫ Leave Day
                          </span>
                        ) : log.minutesWorked >= 480 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                            🟢 Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                            🔴 Deficit
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-200">
                        {log.isLeave ? (
                          <span>{log.leaveHours}h 00m</span>
                        ) : (
                          <span>{formatMinutes(log.minutesWorked)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 hidden md:table-cell max-w-xs truncate">
                        {log.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteLog(log.date)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
