import { parseFrequencyCode } from "@/lib/reminders/frequency";
import { zonedTimeToUtc, addDaysToDateStr } from "@/lib/reminders/timezone";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";

export interface PrescriptionMedicineSchedule {
  id: string;
  frequency_code: string;
  start_date: string;
  duration_days: number;
}

/**
 * Every scheduled dose datetime (UTC) for `medicine` that falls within
 * [rangeStartDate, rangeEndDate] (inclusive, YYYY-MM-DD, evaluated in
 * REMINDER_TIMEZONE), clipped to the medicine's own active window
 * (start_date .. start_date + duration_days - 1). This is the shared
 * "what doses were due" calculation reused by both the patient's
 * mark-as-taken checklist and the doctor's adherence-rate rollups — the
 * medication-reminders cron route computes the same thing inline for a
 * single day, but doesn't need this range form.
 */
export function scheduledDosesInRange(
  medicine: PrescriptionMedicineSchedule,
  rangeStartDate: string,
  rangeEndDate: string
): Date[] {
  const times = parseFrequencyCode(medicine.frequency_code);
  if (times.length === 0) return [];

  const activeEnd = addDaysToDateStr(medicine.start_date, medicine.duration_days - 1);
  const start = medicine.start_date > rangeStartDate ? medicine.start_date : rangeStartDate;
  const end = activeEnd < rangeEndDate ? activeEnd : rangeEndDate;

  const doses: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addDaysToDateStr(cursor, 1)) {
    for (const time of times) {
      doses.push(zonedTimeToUtc(cursor, time, REMINDER_TIMEZONE));
    }
  }
  return doses;
}
