// frequency_code is genuine free text typed by a doctor via a plain text
// input (see NewPrescriptionForm.tsx's placeholder "e.g. 1-0-1, BD, TDS") —
// this parser must never throw, no matter how garbled the input is.

const NAMED_TIMES: Record<string, string[]> = {
  OD: ["08:00"],
  BD: ["08:00", "20:00"],
  BID: ["08:00", "20:00"],
  TDS: ["08:00", "14:00", "20:00"],
  TID: ["08:00", "14:00", "20:00"],
  QID: ["08:00", "13:00", "18:00", "22:00"],
  HS: ["22:00"],
};

const CANONICAL_TIMES_BY_SLOT_COUNT: Record<number, string[]> = {
  2: ["08:00", "20:00"],
  3: ["08:00", "14:00", "20:00"],
  4: ["08:00", "13:00", "18:00", "22:00"],
};

/**
 * Parses a doctor-entered frequency code into a list of "HH:mm" 24-hour
 * local dose times. Never throws — unrecognized input falls back to a
 * single daily dose (OD) and is logged via console.warn so it stays visible
 * rather than silently mishandled forever.
 */
export function parseFrequencyCode(rawCode: string): string[] {
  const code = (rawCode ?? "").trim().toUpperCase();

  // "As needed"/one-off codes mean no scheduled reminder should ever fire
  // for them — checked before the general fallback as a deliberate distinct
  // case, since sending a scheduled reminder for these would be actively
  // wrong (not just imprecise).
  if (code === "SOS" || code === "PRN" || code === "STAT") {
    return [];
  }

  if (code in NAMED_TIMES) {
    return NAMED_TIMES[code];
  }

  // A bare digit with no dash, e.g. "1" or "2" -> treat like OD's
  // single-dose case.
  if (/^\d+$/.test(code)) {
    return Number(code) > 0 ? ["08:00"] : [];
  }

  // Numeric dash-separated slot codes, e.g. "1-0-1", "1-1-1-1": each slot is
  // 0 (skip) or nonzero (include one dose at that slot's canonical time). A
  // slot value greater than 1 still counts as a single dose at that slot's
  // time — a documented MVP simplification, not multiplied.
  if (/^\d+(-\d+)+$/.test(code)) {
    const slots = code.split("-").map(Number);
    const canonicalTimes = CANONICAL_TIMES_BY_SLOT_COUNT[slots.length];
    if (canonicalTimes) {
      return slots.flatMap((slot, index) => (slot > 0 ? [canonicalTimes[index]] : []));
    }
    // An unsupported slot count (e.g. 1 or 5+ parts) falls through to the
    // general fallback below.
  }

  // Anything else unrecognized — including empty strings and day-frequency
  // codes like QOD (every other day), which this parser deliberately does
  // not attempt to model — falls back to a single daily dose (OD). Logged
  // so a doctor-entered value the parser can't handle doesn't go unnoticed.
  console.warn(`parseFrequencyCode: unrecognized frequency_code "${rawCode}", falling back to OD`);
  return ["08:00"];
}
