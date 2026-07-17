/**
 * Utility helper to parse and evaluate 20-minute resident time slots.
 * Format expected: "Today, 04:20 PM - 04:40 PM", "Tomorrow, 11:00 AM - 11:20 AM", etc.
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
  const end = new Date(now.getTime() + 20 * 60 * 1000);
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
 * Helpers to parse a 12-hour AM/PM time string into hours and minutes
 */
export function parseTimeString(tStr: string): { hours: number; minutes: number } {
  const match = tStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return { hours: 0, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  else if (ampm === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

/**
 * Generates 20-minute interval strings from a start and end time window
 */
export function generate20MinSlotsFromWindow(startStr: string, endStr: string): string[] {
  const slots: string[] = [];
  const start = parseTimeString(startStr);
  const end = parseTimeString(endStr);
  
  let currentMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  
  const formatMinsToAMPM = (totMins: number): string => {
    let hrs = Math.floor(totMins / 60);
    const mins = totMins % 60;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    const minsStr = mins < 10 ? '0' + mins : mins;
    return `${hrs}:${minsStr} ${ampm}`;
  };

  while (currentMinutes + 20 <= endMinutes) {
    const sLabel = formatMinsToAMPM(currentMinutes);
    const eLabel = formatMinsToAMPM(currentMinutes + 20);
    slots.push(`${sLabel} - ${eLabel}`);
    currentMinutes += 20;
  }
  return slots;
}

/**
 * Generates dynamic dates and corresponding 20-minute slots for the next 7 days based on weekly recurring availability rules
 */
export function generateAvailableSlotsFromWeekly(weekly?: any[]): string[] {
  if (!weekly || weekly.length === 0) return [];
  
  const slots: string[] = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dayName = daysOfWeek[d.getDay()];
    
    const dayConfig = weekly.find(w => w.day === dayName);
    if (dayConfig && dayConfig.available) {
      const monthName = months[d.getMonth()];
      const dateNum = d.getDate();
      const label = `${monthName} ${dateNum} (${dayName.substring(0, 3)})`;
      
      if (dayConfig.timeWindows && Array.isArray(dayConfig.timeWindows)) {
        dayConfig.timeWindows.forEach((window: any) => {
          const subSlots = generate20MinSlotsFromWindow(window.start, window.end);
          subSlots.forEach(sub => {
            slots.push(`${label}, ${sub}`);
          });
        });
      }
    }
  }
  return slots;
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
