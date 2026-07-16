import { useState, useEffect, useMemo } from 'react';
import { 
  getDateString, 
  getYearMonthKey, 
  getMonthDays,
  getMonthWeekdays, 
  isWeekend, 
  formatMinutes 
} from '../utils/timeUtils';

export interface DayLog {
  date: string; // YYYY-MM-DD
  minutesWorked: number;
  leaveHours: number; // in hours (8 for full day, 4 for half day, etc.)
  isLeave: boolean;
  notes?: string;
}

export interface Settings {
  userName: string;
  dailyTargetMinutes: number;
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: Settings = {
  userName: 'Shubham',
  dailyTargetMinutes: 480, // 8 hours
  theme: 'dark',
};

const SETTINGS_STORAGE_KEY = 'shubham_tracker_settings';
const LOGS_STORAGE_KEY = 'shubham_tracker_logs';
const SESSION_USER_NAME_KEY = 'shubham_tracker_session_user_name';

export function useHoursTracker() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Settings state
  const [settings, setSettings] = useState<Settings>(() => {
    let persistedSettings: Partial<Settings> = {};
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (savedSettings) {
      try {
        persistedSettings = JSON.parse(savedSettings);
      } catch {
        persistedSettings = {};
      }
    }

    const sessionUserName = sessionStorage.getItem(SESSION_USER_NAME_KEY);

    return {
      ...DEFAULT_SETTINGS,
      ...persistedSettings,
      userName: (sessionUserName && sessionUserName.trim()) || DEFAULT_SETTINGS.userName,
    };
  });

  // Daily logs state
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Simulated leaves (in hours) for Simulator view
  const [simulatedLeaves, setSimulatedLeaves] = useState<number>(0);

  // Selected date state (defaults to July 14, 2026, as specified in current local time metadata)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Return July 14, 2026
    return new Date(2026, 6, 14); // month index 6 is July
  });

  // Persist non-session settings to localStorage
  useEffect(() => {
    const persistentSettings = {
      theme: settings.theme,
      dailyTargetMinutes: settings.dailyTargetMinutes,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(persistentSettings));

    // Apply theme
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  // Persist greeter name only for the current browser session
  useEffect(() => {
    sessionStorage.setItem(SESSION_USER_NAME_KEY, settings.userName);
  }, [settings.userName]);

  // Persist logs to localStorage
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  // Update a single log
  const updateLog = (dateString: string, minutesWorked: number, isLeave: boolean, leaveHours: number, notes?: string) => {
    setLogs((prev) => ({
      ...prev,
      [dateString]: {
        date: dateString,
        minutesWorked: isLeave ? 0 : minutesWorked,
        isLeave,
        leaveHours: isLeave ? leaveHours : 0,
        notes,
      },
    }));
  };

  // Delete a single log
  const deleteLog = (dateString: string) => {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[dateString];
      return next;
    });
  };

  // Clear all logs
  const clearAllData = () => {
    setLogs({});
    setSimulatedLeaves(0);
  };

  // Import pasted working hours and convert into weekday logs for the selected month.
  //
  // Rules:
  // 1. If entries match exact month-day count, map day-by-day and treat weekday
  //    0-minute entries as leave days.
  // 2. Otherwise map to sequential weekdays. If the series contains weekend-style
  //    zero pairs, only extra zeros beyond the pair are treated as leave days.
  //    Example: 0,0,0 => weekend + 1 leave.
  const applyPastedHours = (entries: number[]) => {
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth();
    const monthDays = getMonthDays(year, monthIndex);
    const weekdays = getMonthWeekdays(year, monthIndex);

    const newLogs: Record<string, DayLog> = {};
    const isExactMonthSeries = entries.length === monthDays.length;

    const addLeaveLog = (dateKey: string) => {
      newLogs[dateKey] = {
        date: dateKey,
        minutesWorked: 0,
        isLeave: true,
        leaveHours: 8,
        notes: 'Imported from paste (leave day)',
      };
    };

    const addWorkLog = (dateKey: string, mins: number) => {
      newLogs[dateKey] = {
        date: dateKey,
        minutesWorked: mins,
        isLeave: false,
        leaveHours: 0,
        notes: 'Imported from paste',
      };
    };

    if (isExactMonthSeries) {
      monthDays.forEach((day, index) => {
        if (isWeekend(day)) return;

        const mins = entries[index];
        if (mins === undefined) return;
        const key = getDateString(day);

        if (mins <= 0) {
          addLeaveLog(key);
          return;
        }

        addWorkLog(key, mins);
      });
    } else {
      // Analyze zero runs to infer whether weekends are included in the pasted text.
      const zeroRuns: number[] = [];
      let runLength = 0;
      entries.forEach((mins) => {
        if (mins <= 0) {
          runLength += 1;
          return;
        }
        if (runLength > 0) {
          zeroRuns.push(runLength);
          runLength = 0;
        }
      });
      if (runLength > 0) zeroRuns.push(runLength);

      const hasWeekendPattern = zeroRuns.some((run) => run >= 2);

      let weekdayCursor = 0;
      let pendingZeroRun = 0;

      const consumeZeroRunAsLeave = () => {
        if (pendingZeroRun === 0) return;

        const leaveDays = hasWeekendPattern
          ? Math.max(0, pendingZeroRun - 2)
          : pendingZeroRun;

        for (let i = 0; i < leaveDays; i += 1) {
          if (weekdayCursor >= weekdays.length) break;
          const leaveKey = getDateString(weekdays[weekdayCursor]);
          addLeaveLog(leaveKey);
          weekdayCursor += 1;
        }

        pendingZeroRun = 0;
      };

      entries.forEach((mins) => {
        if (weekdayCursor >= weekdays.length) return;

        if (mins <= 0) {
          pendingZeroRun += 1;
          return;
        }

        consumeZeroRunAsLeave();
        if (weekdayCursor >= weekdays.length) return;

        const key = getDateString(weekdays[weekdayCursor]);
        addWorkLog(key, mins);
        weekdayCursor += 1;
      });

      consumeZeroRunAsLeave();
    }

    setLogs(newLogs);
    setSimulatedLeaves(0);
  };

  // Load demo mock data (specifically July 1 to 14, 2026)
  const loadMockData = () => {
    const mockLogs: Record<string, DayLog> = {
      '2026-07-01': { date: '2026-07-01', minutesWorked: 480, isLeave: false, leaveHours: 0, notes: 'Target achieved' },
      '2026-07-02': { date: '2026-07-02', minutesWorked: 450, isLeave: false, leaveHours: 0, notes: '30m short today' },
      '2026-07-03': { date: '2026-07-03', minutesWorked: 495, isLeave: false, leaveHours: 0, notes: 'Stayed late to cover' },
      // July 4-5 are weekends (Saturday/Sunday)
      '2026-07-06': { date: '2026-07-06', minutesWorked: 510, isLeave: false, leaveHours: 0, notes: 'Finished project release' },
      '2026-07-07': { date: '2026-07-07', minutesWorked: 465, isLeave: false, leaveHours: 0, notes: 'Left slightly early' },
      '2026-07-08': { date: '2026-07-08', minutesWorked: 480, isLeave: false, leaveHours: 0, notes: 'Standard day' },
      '2026-07-09': { date: '2026-07-09', minutesWorked: 390, isLeave: false, leaveHours: 0, notes: 'Had doctor appointment' },
      '2026-07-10': { date: '2026-07-10', minutesWorked: 480, isLeave: false, leaveHours: 0, notes: 'Friday wrap-up' },
      // July 11-12 are weekends
      '2026-07-13': { date: '2026-07-13', minutesWorked: 300, isLeave: false, leaveHours: 0, notes: 'Short on hours' },
      '2026-07-14': { date: '2026-07-14', minutesWorked: 480, isLeave: false, leaveHours: 0, notes: 'Completed full hours today' }
    };
    setLogs(mockLogs);
    setSimulatedLeaves(0);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Computations for the selected month
  const stats = useMemo(() => {
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth();
    
    // Get all weekdays (Mon-Fri) in the selected month
    const weekdaysInMonth = getMonthWeekdays(year, monthIndex);
    const totalWeekdays = weekdaysInMonth.length;
    
    // Calculate completed weekdays (any weekday in the selected month that has been logged).
    // Logged days are the source of truth, so every logged weekday counts toward progress
    // and the required-hours total, keeping the dashboard in sync with the calculator.
    const completedWeekdaysList = weekdaysInMonth.filter(d => {
      const key = getDateString(d);
      return logs[key] !== undefined;
    });
    
    const completedWeekdays = completedWeekdaysList.length;
    const remainingWeekdays = totalWeekdays - completedWeekdays;
    
    // Target calculations
    const dailyTarget = settings.dailyTargetMinutes;
    const requiredMinutesTillToday = completedWeekdays * dailyTarget;
    const totalTargetMinutes = totalWeekdays * dailyTarget;
    
    // Calculate completed minutes till today (actual worked + leave equivalent)
    let workedMinutesTillToday = 0;
    let leaveMinutesTillToday = 0;
    let leaveDaysCount = 0;
    let actualLeaveDaysWorkedMinus = 0; // count of actual leave days (to adjust average calculation)
    
    completedWeekdaysList.forEach(d => {
      const key = getDateString(d);
      const log = logs[key];
      if (log) {
        if (log.isLeave) {
          leaveMinutesTillToday += log.leaveHours * 60;
          leaveDaysCount += log.leaveHours / 8.0;
          actualLeaveDaysWorkedMinus += 1;
        } else {
          workedMinutesTillToday += log.minutesWorked;
        }
      } else {
        // If not logged, defaults to 0 worked minutes, 0 leave
      }
    });

    const completedMinutesTillToday = workedMinutesTillToday + leaveMinutesTillToday;
    const netMinutesStatus = completedMinutesTillToday - requiredMinutesTillToday;
    const isAhead = netMinutesStatus >= 0;
    const netMinutesStatusAbs = Math.abs(netMinutesStatus);
    
    // Average worked hours per day (excluding leave days to not skew average)
    const activeWorkingDaysCount = completedWeekdays - actualLeaveDaysWorkedMinus;
    const averageMinutesPerDay = activeWorkingDaysCount > 0 
      ? Math.round(workedMinutesTillToday / activeWorkingDaysCount)
      : dailyTarget;
      
    // Forecast calculations
    const projectedWorkedMinutesRemaining = averageMinutesPerDay * remainingWeekdays;
    const projectedWorkedMinutes = workedMinutesTillToday + projectedWorkedMinutesRemaining;
    const projectedLeaveMinutes = leaveMinutesTillToday;
    
    const projectedTotalMinutes = projectedWorkedMinutes + projectedLeaveMinutes;
    const expectedMonthEndStatus = projectedTotalMinutes - totalTargetMinutes;
    
    // Leave credit (Every month you receive 1 Leave = 8h 00m = 480 minutes).
    // Credit is based on the CURRENT hours shortage (lagging) till today.
    // Formula: leaveCredit = 1 - (shortageHours / 8).
    // Example: short by 7h => 7/8 = 0.875 => credit = 1 - 0.875 = 0.125
    const currentShortageMinutes = netMinutesStatus < 0 ? Math.abs(netMinutesStatus) : 0;
    const leaveUsedThisMonth = (projectedLeaveMinutes + currentShortageMinutes) / 480.0;
    const remainingLeaveBalance = 1.0 - leaveUsedThisMonth;
    const remainingLeaveMinutes = remainingLeaveBalance * 480.0;
    
    // Simulated values (simulating additional leave days in the simulator page)
    const simulatedLeaveMinutes = simulatedLeaves * 60;
    // When simulating leave, we replace standard work hours on simulated days with leave hours.
    // Let's assume simulated leaves are taken in the remaining days.
    // Each simulated leave day reduces the days we work at our average rate by 1, and adds to leave hours.
    const simulatedDays = Math.ceil(simulatedLeaves / 8.0);
    const adjustedRemainingWorkedDays = Math.max(0, remainingWeekdays - simulatedDays);
    
    const simulatedProjectedWorkedRemaining = averageMinutesPerDay * adjustedRemainingWorkedDays;
    const simulatedProjectedTotal = workedMinutesTillToday + simulatedProjectedWorkedRemaining + projectedLeaveMinutes + simulatedLeaveMinutes;
    
    const simulatedMonthEndStatus = simulatedProjectedTotal - totalTargetMinutes;
    const simulatedShortageMinutes = simulatedMonthEndStatus < 0 ? Math.abs(simulatedMonthEndStatus) : 0;
    const simulatedLeaveUsed = (projectedLeaveMinutes + simulatedLeaveMinutes + simulatedShortageMinutes) / 480.0;
    const simulatedLeaveBalance = 1.0 - simulatedLeaveUsed;
    const simulatedLeaveMinutesRemaining = simulatedLeaveBalance * 480.0;

    return {
      year,
      monthIndex,
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
      
      // Simulated metrics
      simulatedLeaves,
      simulatedDays,
      simulatedProjectedTotal,
      simulatedMonthEndStatus,
      simulatedShortageMinutes,
      simulatedLeaveUsed,
      simulatedLeaveBalance,
      simulatedLeaveMinutesRemaining
    };
  }, [logs, settings, selectedDate, simulatedLeaves]);

  return {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    logs,
    settings,
    simulatedLeaves,
    setSimulatedLeaves,
    updateLog,
    deleteLog,
    clearAllData,
    loadMockData,
    applyPastedHours,
    updateSettings,
    stats,
  };
}
