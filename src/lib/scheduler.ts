/**
 * Appointment Scheduling Rules
 * - Work days: Mon, Wed, Thu, Fri, Sat (OFF Tuesday, OFF Sunday)
 * - Hours: 8:45 AM – 6:30 PM Eastern
 * - Slot duration: 2 hours (prevents double-booking)
 */

import { addDays, format } from "date-fns";

// Work schedule (times in local machine time – run app in Eastern time zone)
const WORK_START = { h: 8, m: 45 };   // 8:45 AM
const WORK_END = { h: 18, m: 30 };    // 6:30 PM
const SLOT_DURATION_MIN = 120;         // 2 hours
const OFF_DAYS = [0, 2];               // 0=Sunday, 2=Tuesday

function isWorkDay(date: Date): boolean {
  return !OFF_DAYS.includes(date.getDay());
}

/** Generate all possible 2-hour slot start times for a given calendar day */
function getSlotsForDay(date: Date): Date[] {
  const slots: Date[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let current = new Date(year, month, day, WORK_START.h, WORK_START.m, 0);
  const end = new Date(year, month, day, WORK_END.h, WORK_END.m, 0);

  while (current.getTime() + SLOT_DURATION_MIN * 60000 <= end.getTime()) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + SLOT_DURATION_MIN * 60000);
  }
  return slots;
}

export interface AvailableSlot {
  start: Date;
  end: Date;
  label: string; // "Mon Jun 10 • 10:45 AM – 12:45 PM"
}

/**
 * Return available appointment slots for the next N work days,
 * excluding times already booked in existingAppointments.
 */
export function getAvailableSlots(
  existingAppointments: { startTime: Date; endTime: Date }[],
  daysAhead = 14
): AvailableSlot[] {
  const available: AvailableSlot[] = [];
  const now = new Date();

  for (let i = 0; i < daysAhead + 7; i++) {
    const candidate = addDays(now, i);
    if (!isWorkDay(candidate)) continue;

    const daySlots = getSlotsForDay(candidate);

    for (const slotStart of daySlots) {
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MIN * 60000);

      // Skip past slots (add 30-min buffer)
      if (slotStart.getTime() < now.getTime() + 30 * 60000) continue;

      // Check overlap with existing appointments
      const overlaps = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        return slotStart < apptEnd && slotEnd > apptStart;
      });

      if (!overlaps) {
        available.push({
          start: slotStart,
          end: slotEnd,
          label: `${format(slotStart, "EEE MMM d")} • ${format(slotStart, "h:mm a")} – ${format(slotEnd, "h:mm a")}`,
        });
      }

      if (available.length >= 30) return available; // Return first 30 slots
    }
  }

  return available;
}

export { SLOT_DURATION_MIN };
