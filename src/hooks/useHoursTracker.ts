import { useState, useEffect, useMemo } from 'react';
import { 
  getDateString, 
  getYearMonthKey, 
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

export function useHoursTracker() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Settings state
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('shubham_tracker_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Daily logs state
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => {
    const saved = localStorage.getItem('shubham_tracker_logs');
    return saved ? JSON.parse(saved) : {};
  });

  // Simulated leaves (in hours) for Simulator view
  const [simulatedLeaves, setSimulatedLeaves] = useState<number>(0);

  // Selected date state (defaults to July 14, 2026, as specified in current local time metadata)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Return July 14, 2026
    return new Date(2026, 6, 14); // month index 6 is July
  });

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('shubham_tracker_settings', JSON.stringify(settings));
    // Apply theme
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  // Persist logs to localStorage
  useEffect(() => {
    localStorage.setItem('shubham_tracker_logs', JSON.stringify(logs));
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

  // Import pasted working hours: maps each non-zero entry (in minutes) to
  // consecutive weekdays of the selected month, replacing existing logs.
  const applyPastedHours = (entries: number[]) => {
    const workEntries = entries.filter((m) => m > 0);
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth();
    const weekdays = getMonthWeekdays(year, monthIndex);

    const newLogs: Record<string, DayLog> = {};
    workEntries.forEach((mins, i) => {
      if (i >= weekdays.length) return;
      const key = getDateString(weekdays[i]);
      newLogs[key] = {
        date: key,
        minutesWorked: mins,
        isLeave: false,
        leaveHours: 0,
        notes: 'Imported from paste',
      };
    });

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
    
    // For July 2026, today is July 14, 2026
    const today = new Date(2026, 6, 14); // Lock current date as July 14, 2026
    
    // Calculate completed weekdays (weekdays in selected month that are <= today AND have been logged)
    const completedWeekdaysList = weekdaysInMonth.filter(d => {
      const isPastOrToday = (() => {
        if (year < today.getFullYear()) return true;
        if (year > today.getFullYear()) return false;
        if (monthIndex < today.getMonth()) return true;
        if (monthIndex > today.getMonth()) return false;
        return d.getDate() <= today.getDate();
      })();
      
      if (!isPastOrToday) return false;
      
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
