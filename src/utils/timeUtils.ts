/**
 * Formats a duration in minutes into a human-readable format: "Xh Ym" or "-Xh Ym".
 * Never displays decimal hours.
 */
export function formatMinutes(minutes: number): string {
  const isNegative = minutes < 0;
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const formattedMins = String(mins).padStart(2, '0');
  return `${isNegative ? '-' : ''}${hours}h ${formattedMins}m`;
}

/**
 * Robustly parses a time string or format and returns the duration in minutes.
 * Examples: "7h 30m", "7:30", "7.5h", "7.5", "6h 40m", "07:30:00"
 */
export function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  
  const cleanStr = timeStr.trim().toLowerCase();
  
  // 1. Matches "7h 30m" or "7h30m" or "7h 30"
  const hmMatch = cleanStr.match(/^(\d+)\s*h\s*(\d+)\s*m?$/) || cleanStr.match(/^(\d+)\s*h\s*(\d+)?$/);
  if (hmMatch) {
    const hours = parseInt(hmMatch[1], 10);
    const minutes = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    return hours * 60 + minutes;
  }
  
  // 2. Matches "07:30:00" or "7:30"
  const colonMatch = cleanStr.match(/^(\d+):(\d+)(?::\d+)?$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const minutes = parseInt(colonMatch[2], 10);
    return hours * 60 + minutes;
  }
  
  // 3. Matches decimal representation like "7.5h" or "7.5 hrs" or "7.5 hours"
  const decMatch = cleanStr.match(/^(\d+(?:\.\d+)?)\s*(?:hrs|hr|hours|hour|h)$/);
  if (decMatch) {
    const hours = parseFloat(decMatch[1]);
    return Math.round(hours * 60);
  }
  
  // 4. Matches just minutes like "30m"
  const minMatch = cleanStr.match(/^(\d+)\s*m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // 5. If it's a plain number (e.g. "8" or "7.5"), parse as hours
  if (!isNaN(Number(cleanStr))) {
    const hours = parseFloat(cleanStr);
    return Math.round(hours * 60);
  }
  
  return 0;
}

export interface PastedHoursResult {
  entries: number[];        // minutes for each parsed entry
  workingDays: number;      // count of entries with more than 0 minutes
  totalWorkedMinutes: number;
  requiredMinutes: number;  // workingDays * dailyTargetMinutes
  netMinutes: number;       // worked - required (negative = lagging)
}

/**
 * Parses a block of pasted working hours and compares it against the daily target.
 * Understands entries like "7 hrs, 30 min", "8 hrs 8 min", "5 hrs", or "0 min",
 * separated by spaces, tabs or new lines. Only entries greater than 0 minutes
 * are counted as working days.
 */
export function parsePastedHours(text: string, dailyTargetMinutes: number): PastedHoursResult {
  const entries: number[] = [];
  const regex = /(\d+)\s*(?:hrs?|hours?|h)\b(?:\s*,?\s*(\d+)\s*(?:min|mins|m)?)?|(\d+)\s*(?:min|mins|m)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      const hours = parseInt(match[1], 10);
      const mins = match[2] ? parseInt(match[2], 10) : 0;
      entries.push(hours * 60 + mins);
    } else if (match[3] !== undefined) {
      entries.push(parseInt(match[3], 10));
    }
  }

  const workingDays = entries.filter((m) => m > 0).length;
  const totalWorkedMinutes = entries.reduce((sum, m) => sum + m, 0);
  const requiredMinutes = workingDays * dailyTargetMinutes;
  const netMinutes = totalWorkedMinutes - requiredMinutes;

  return { entries, workingDays, totalWorkedMinutes, requiredMinutes, netMinutes };
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Returns formatted date key YYYY-MM-DD.
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns month key YYYY-MM.
 */
export function getYearMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get all weekdays (Mon-Fri) in a given month.
 */
export function getMonthWeekdays(year: number, monthIndex: number): Date[] {
  const date = new Date(year, monthIndex, 1);
  const weekdays: Date[] = [];
  
  while (date.getMonth() === monthIndex) {
    if (!isWeekend(date)) {
      weekdays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  
  return weekdays;
}

/**
 * Get all days in a given month.
 */
export function getMonthDays(year: number, monthIndex: number): Date[] {
  const date = new Date(year, monthIndex, 1);
  const days: Date[] = [];
  
  while (date.getMonth() === monthIndex) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
}

/**
 * Get a grid of dates representing the monthly calendar view.
 * It pads the start of the grid with days from the previous month and
 * the end of the grid with days from the next month to form clean 7-day rows.
 */
export function getCalendarGridDays(year: number, monthIndex: number): Date[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  const grid: Date[] = [];
  
  // Calculate day index (0 for Sun, 1 for Mon, etc.)
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Pad previous month days (going back to Sunday)
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    grid.push(new Date(year, monthIndex - 1, prevMonthLastDay - i));
  }
  
  // Current month days
  const totalDays = lastDayOfMonth.getDate();
  for (let i = 1; i <= totalDays; i++) {
    grid.push(new Date(year, monthIndex, i));
  }
  
  // Pad next month days to align with a grid of 6 weeks (42 cells) or 5 weeks (35 cells)
  // Standard grid is 42 cells to cover all configurations.
  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push(new Date(year, monthIndex + 1, i));
  }
  
  return grid;
}

/**
 * Returns a friendly dynamic greeting based on the hour of the day.
 */
export function getGreeting(userName: string): string {
  const hour = new Date().getHours();
  let salutation = 'Good Morning';
  
  if (hour >= 12 && hour < 17) {
    salutation = 'Good Afternoon';
  } else if (hour >= 17) {
    salutation = 'Good Evening';
  }
  
  return `${salutation}, ${(userName && userName.trim()) || 'buddy'} 👋`;
}

/**
 * Smart parses raw attendance data text pasted from office portals.
 * Returns an array of parsed log entries with computed dates.
 * It reads line by line, detects valid times, and sequential weekdays starting from a designated base date.
 */
export interface ParsedAttendanceResult {
  dateString: string;
  originalText: string;
  minutesParsed: number;
  isValid: boolean;
}

export function parsePastedAttendance(
  text: string,
  startDate: Date = new Date()
): ParsedAttendanceResult[] {
  const lines = text.split('\n');
  const results: ParsedAttendanceResult[] = [];
  
  // Create a copy of the start date to increment
  let currentDate = new Date(startDate);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Attempt to parse a time value from the line
    // Look for patterns like "7h 30m", "08:12", "7.5h" anywhere in the line
    let minutes = 0;
    let found = false;
    
    // Look for exact hour-minute patterns first
    const hmReg = /(\d+)\s*h\s*(\d+)\s*m/i;
    const colonReg = /(\d{1,2}):(\d{2})(?::\d{2})?/;
    const decReg = /(\d+(?:\.\d+)?)\s*(?:hrs|hr|hours|hour|h)\b/i;
    
    let match = trimmed.match(hmReg);
    if (match) {
      minutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      found = true;
    } else {
      match = trimmed.match(colonReg);
      if (match) {
        minutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        found = true;
      } else {
        match = trimmed.match(decReg);
        if (match) {
          minutes = Math.round(parseFloat(match[1]) * 60);
          found = true;
        }
      }
    }
    
    if (found) {
      // Find the next available weekday (skipping Saturdays & Sundays)
      while (isWeekend(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      results.push({
        dateString: getDateString(currentDate),
        originalText: trimmed,
        minutesParsed: minutes,
        isValid: true
      });
      
      // Move to the next day for the next line
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return results;
}
