import { useState, useEffect, useMemo } from 'react';
import { 
  getDateString, 
  getYearMonthKey, 
  getMonthDays,
  getMonthWeekdays, 
  getToday,
  isWeekend, 
  formatMinutes 
} from '../utils/timeUtils';
import type { WeatherType } from '../components/WeatherEffect';

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
  weather: WeatherType;
}

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  dailyTargetMinutes: 480, // 8 hours
  theme: 'dark',
  weather: 'default',
};

const SETTINGS_STORAGE_KEY = 'shubham_tracker_settings';
const LOGS_STORAGE_KEY = 'shubham_tracker_logs';
const SESSION_USER_NAME_KEY = 'sg_tracker_session_user_name_v2';

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

    // Remove the legacy key that used to seed a default "Shubham" name
    sessionStorage.removeItem('shubham_tracker_session_user_name');

    return {
      ...DEFAULT_SETTINGS,
      ...persistedSettings,
      userName: (sessionUserName && sessionUserName.trim()) || DEFAULT_SETTINGS.userName,
    };
  });

  // Daily logs state - intentionally NOT persisted, so every page load starts clean
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => {
    // Drop any logs saved by previous versions of the app
    localStorage.removeItem(LOGS_STORAGE_KEY);
    return {};
  });

  // Simulated leaves (in hours) for Simulator view
  const [simulatedLeaves, setSimulatedLeaves] = useState<number>(0);

  // Selected date state (defaults to the real current date)
  const [selectedDate, setSelectedDate] = useState<Date>(() => getToday());

  // Persist non-session settings to localStorage
  useEffect(() => {
    const persistentSettings = {
      theme: settings.theme,
      dailyTargetMinutes: settings.dailyTargetMinutes,
      weather: settings.weather,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(persistentSettings));

    // Apply theme
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings]);

  // Persist greeter name only for the current browser session
  useEffect(() => {
    sessionStorage.setItem(SESSION_USER_NAME_KEY, settings.userName);
  }, [settings.userName]);

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
      let weekdayCursor = 0;
      let pendingZeroRun = 0;

      const consumeZeroRunAsLeave = () => {
        if (pendingZeroRun === 0) return;

        // A run of 2+ zeros is a weekend (the extra zeros beyond it are leaves).
        // A single zero sitting between working days is a leave day.
        const leaveDays = pendingZeroRun >= 2
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

    // Number of weekday leaves detected in the pasted series
    return Object.values(newLogs).filter((log) => log.isLeave).length;
  };

  // Load demo mock data onto the weekdays of the selected month, up to today
  const loadMockData = () => {
    const demoMinutes = [480, 450, 495, 510, 465, 480, 390, 480, 300, 480];
    const demoNotes = [
      'Target achieved',
      '30m short today',
      'Stayed late to cover',
      'Finished project release',
      'Left slightly early',
      'Standard day',
      'Had doctor appointment',
      'Friday wrap-up',
      'Short on hours',
      'Completed full hours today',
    ];

    const today = getToday();
    const weekdays = getMonthWeekdays(selectedDate.getFullYear(), selectedDate.getMonth())
      .filter((d) => d <= today)
      .slice(0, demoMinutes.length);

    const mockLogs: Record<string, DayLog> = {};
    weekdays.forEach((day, index) => {
      const key = getDateString(day);
      mockLogs[key] = {
        date: key,
        minutesWorked: demoMinutes[index],
        isLeave: false,
        leaveHours: 0,
        notes: demoNotes[index],
      };
    });

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

    // Remaining working days come from the real calendar: only weekdays that are still
    // ahead of today (today itself is already worked) and have no log yet.
    const today = getToday();
    const remainingWeekdays = weekdaysInMonth.filter((d) => {
      if (d <= today) return false;
      return logs[getDateString(d)] === undefined;
    }).length;
    
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
