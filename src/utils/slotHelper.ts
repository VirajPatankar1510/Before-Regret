/**
 * Utility helper to parse and evaluate 30-minute resident time slots.
 * Format expected: "Today, 04:30 PM - 05:00 PM", "Tomorrow, 11:00 AM - 11:30 AM", etc.
 */

export interface SlotTimeRange {
  start: Date;
  end: Date;
  startRemind: Date;
}

export function parseSlotTimeRange(slotStr: string): SlotTimeRange {
  const now = new Date();
  // Set default fallback dates
  const start = new Date(now);
  const end = new Date(now.getTime() + 30 * 60 * 1000);
  const startRemind = new Date(start.getTime() - 15 * 60 * 1000);

  if (!slotStr) {
    return { start, end, startRemind };
  }

  try {
    const parts = slotStr.split(',');
    if (parts.length < 2) return { start, end, startRemind };

    const dayStr = parts[0].trim().toLowerCase();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let matchedMonthIndex = -1;
    let matchedDay = -1;

    // Check relative first
    if (dayStr === 'tomorrow') {
      baseDate.setDate(baseDate.getDate() + 1);
    } else if (dayStr === 'day after tomorrow') {
      baseDate.setDate(baseDate.getDate() + 2);
    } else if (dayStr !== 'today') {
      // Parse dynamic month and date, e.g. "jul 18 (sat)"
      const words = dayStr.split(/[^a-z0-9]+/i);
      for (const w of words) {
        const idx = months.indexOf(w.substring(0, 3));
        if (idx !== -1) {
          matchedMonthIndex = idx;
        } else {
          const num = parseInt(w, 10);
          if (!isNaN(num) && num >= 1 && num <= 31) {
            matchedDay = num;
          }
        }
      }

      if (matchedMonthIndex !== -1 && matchedDay !== -1) {
        baseDate.setMonth(matchedMonthIndex);
        baseDate.setDate(matchedDay);
        // If the date is earlier in the year than today, assume next year (for safety)
        if (baseDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 100 * 24 * 60 * 60 * 1000) {
          baseDate.setFullYear(now.getFullYear() + 1);
        }
      }
    }

    const timeRange = parts[1].trim(); // e.g. "04:30 PM - 05:00 PM"
    const times = timeRange.split('-');
    if (times.length < 2) return { start, end, startRemind };

    const parseTimeStr = (tStr: string): Date => {
      const clean = tStr.trim();
      const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return new Date(baseDate);
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      const d = new Date(baseDate.getTime());
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const startTime = parseTimeStr(times[0]);
    const endTime = parseTimeStr(times[1]);
    const remindTime = new Date(startTime.getTime() - 15 * 60 * 1000);

    return {
      start: startTime,
      end: endTime,
      startRemind: remindTime
    };
  } catch (err) {
    console.error('Error parsing slot string:', slotStr, err);
    return { start, end, startRemind };
  }
}

/**
 * Checks if the current time is within the slot time range.
 */
export function isSlotActive(slotStr: string): boolean {
  if (!slotStr) return false;
  const { start, end } = parseSlotTimeRange(slotStr);
  const now = new Date();
  return now >= start && now <= end;
}

/**
 * Returns whether the current time is 15 minutes before the slot starts (up until it actually starts).
 */
export function isReminderTime(slotStr: string): boolean {
  if (!slotStr) return false;
  const { start, startRemind } = parseSlotTimeRange(slotStr);
  const now = new Date();
  return now >= startRemind && now < start;
}
