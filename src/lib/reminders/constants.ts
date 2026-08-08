// Shared tuning constants for the email reminders engine. Sized around an
// assumed ~15-minute Vercel Cron cadence (see vercel.json) — if the cron
// schedule is ever widened, these windows need to widen with it.

// No per-patient timezone column exists yet — every reminder is computed
// against this single clinic-wide zone. See .env.example for more detail.
export const REMINDER_TIMEZONE = process.env.REMINDER_TIMEZONE || "Asia/Kolkata";

// How stale a computed dose time is allowed to be and still fire. Generous
// enough to comfortably span a missed/delayed cron tick at ~15-minute
// cadence without ever sending a dose reminder hours after the fact.
export const DOSE_GRACE_MS = 3 * 60 * 60 * 1000; // 3 hours

// How far past an appointment's 24h/1h boundary a cron tick is still
// allowed to treat it as "due" — a small buffer over the ~15-minute cadence
// so a slightly-delayed invocation doesn't miss the window entirely.
export const STALE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// How long a reminder_log row is allowed to sit in 'pending' before a later
// cron tick treats it as orphaned and reaps it to 'failed'. A row can only
// be stuck this long if the invocation that claimed it (insert to 'pending')
// died before it could resolve to 'sent'/'failed' — e.g. hitting the route's
// `maxDuration = 60` mid-loop. Sized comfortably above that 60s ceiling so a
// still-in-flight claim from the current invocation is never reaped out from
// under it, while still being far shorter than the ~15-minute cron cadence
// so an orphaned claim gets swept and retried on close to the next tick.
export const PENDING_STALE_MS = 5 * 60 * 1000; // 5 minutes
