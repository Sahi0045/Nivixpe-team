/**
 * Attendance & Session Time Utility Functions
 * Handles robust parsing of 12-hour, 24-hour, and timestamp strings
 * to eliminate NaN bugs and support seamless pause/resume math.
 */

/**
 * Parses any time string ("09:30 AM", "9:30 PM", "14:30:15", "09:30")
 * into total minutes past midnight. Returns null if invalid.
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // Check for 12-hour AM/PM format
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (isNaN(hours) || isNaN(minutes)) return null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check for 24-hour format (HH:mm or HH:mm:ss)
  const h24Match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Calculates elapsed session minutes between startTime and endTime.
 * Automatically handles night shifts (sessions spanning past midnight).
 */
export function calculateSessionMinutes(startTime?: string | null, endTime?: string | null): number {
  const startMins = parseTimeToMinutes(startTime);
  if (startMins === null) return 0;

  let endMins: number;
  if (endTime) {
    const parsedEnd = parseTimeToMinutes(endTime);
    if (parsedEnd === null) return 0;
    endMins = parsedEnd;
  } else {
    const now = new Date();
    endMins = now.getHours() * 60 + now.getMinutes();
  }

  if (endMins < startMins) {
    endMins += 1440; // Add 24 hours in minutes for midnight rollover
  }

  return Math.max(0, endMins - startMins);
}

/**
 * Formats total minutes into a human-readable "Xh Ym" format.
 */
export function formatMinutes(mins: number): string {
  if (isNaN(mins) || mins < 0) return '0h 0m';
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Formats current local time as HH:mm (24-hour format).
 */
export function getCurrentTimeString(): string {
  const n = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(n.getHours())}:${pad(n.getMinutes())}`;
}

/**
 * Formats time string into clean 12-hour AM/PM format for UI display.
 */
export function formatTimeDisplay(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;

  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${h12}:${pad(m)} ${period}`;
}
