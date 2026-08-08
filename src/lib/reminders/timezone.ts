// Pure timezone helpers built on Intl.DateTimeFormat — no date library is
// installed in this repo, and Intl correctly resolves an IANA zone's actual
// offset (including DST where applicable) instead of hardcoding one.

/**
 * Converts a local wall-clock date + time in `timeZone` to the UTC instant
 * it represents.
 *
 * Works by formatting a UTC-based guess in the target zone, measuring the
 * difference from the intended wall-clock time, and correcting for it. One
 * correction pass is sufficient for all real-world IANA zones (fixed or
 * whole-number-of-minutes offsets), including DST transitions.
 */
export function zonedTimeToUtc(localDateStr: string, localTimeStr: string, timeZone: string): Date {
  const [year, month, day] = localDateStr.split("-").map(Number);
  const [hour, minute] = localTimeStr.split(":").map(Number);

  // Treat the desired wall-clock values as if they were UTC — a first guess.
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  // Ask what wall-clock time that instant actually renders as in the target
  // zone, then correct the guess by the difference.
  const rendered = getZonedParts(new Date(guess), timeZone);
  const renderedAsUtc = Date.UTC(
    rendered.year,
    rendered.month - 1,
    rendered.day,
    rendered.hour,
    rendered.minute,
    rendered.second
  );

  const diff = guess - renderedAsUtc;
  return new Date(guess + diff);
}

/** Returns `timeZone`'s current local date as YYYY-MM-DD. */
export function todayInZone(referenceDate: Date, timeZone: string): string {
  const { year, month, day } = getZonedParts(referenceDate, timeZone);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = part.value;
  }

  // Intl can render midnight as "24" in the hour field for hour12: false.
  const hour = Number(lookup.hour) % 24;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}
