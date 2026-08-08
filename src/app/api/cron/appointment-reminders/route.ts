import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/reminders/cronAuth";
import {
  claimReminder,
  markReminderSent,
  markReminderFailed,
  reapStalePendingReminders,
} from "@/lib/reminders/log";
import { STALE_WINDOW_MS, PENDING_STALE_MS } from "@/lib/reminders/constants";
import { sendReminderEmail } from "@/lib/email/resend";
import { appointmentReminderEmail } from "@/lib/email/templates";
import type { ReminderType } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowMs = now.getTime();

  const summary = { checked: 0, sent: 0, skipped: 0, failed: 0, reaped: 0 };

  // Sweep any 'pending' claims orphaned by a previous invocation that died
  // mid-loop (e.g. hit maxDuration) before this tick attempts new claims —
  // otherwise those reminders would be permanently unretriable, since only
  // 'failed' rows are excluded from reminder_log_claim_idx.
  summary.reaped = await reapStalePendingReminders(admin, PENDING_STALE_MS);

  // A single query covers candidates for both the 24h and 1h windows: any
  // scheduled, still-future appointment within the next ~24h15m. The extra
  // buffer (STALE_WINDOW_MS) accommodates a slightly-delayed cron tick so an
  // appointment right at the edge of the 24h boundary isn't missed.
  const { data: appointments, error } = await admin
    .from("appointments")
    .select("id, patient_id, doctor_id, appointment_at, status")
    .eq("status", "scheduled")
    .gt("appointment_at", now.toISOString())
    .lte("appointment_at", new Date(nowMs + DAY_MS + STALE_WINDOW_MS).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  summary.checked = appointments?.length ?? 0;

  type DuePair = { reminderType: ReminderType; appointment: NonNullable<typeof appointments>[number] };
  const due: DuePair[] = [];

  for (const appointment of appointments ?? []) {
    const appointmentAtMs = new Date(appointment.appointment_at).getTime();
    const minus24h = appointmentAtMs - DAY_MS;
    const minus1h = appointmentAtMs - HOUR_MS;

    // Windows partition the timeline with no gap and no overlap: 24h window
    // is [appointment-24h, appointment-1h), 1h window is [appointment-1h, appointment).
    // Known limitation, accepted for this phase: an appointment booked with
    // under 24 hours' notice immediately satisfies the 24h window's lower
    // bound and may fire right away with "tomorrow"-styled copy even though
    // the appointment might be sooner — not special-cased here.
    if (nowMs >= minus24h && nowMs < minus1h) {
      due.push({ reminderType: "appointment_24h", appointment });
    } else if (nowMs >= minus1h && nowMs < appointmentAtMs) {
      due.push({ reminderType: "appointment_1h", appointment });
    }
  }

  if (due.length === 0) {
    return NextResponse.json(summary);
  }

  // Batch-fetch patient/doctor full_name in one query each — this repo's
  // Database type file has empty Relationships arrays, so nested
  // embedded-select type inference doesn't work here (see types.ts).
  const profileIds = Array.from(
    new Set(due.flatMap((d) => [d.appointment.patient_id, d.appointment.doctor_id]))
  );
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", profileIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "there"]));

  for (const { reminderType, appointment } of due) {
    const scheduledFor =
      reminderType === "appointment_24h"
        ? new Date(new Date(appointment.appointment_at).getTime() - DAY_MS)
        : new Date(new Date(appointment.appointment_at).getTime() - HOUR_MS);

    const claimedId = await claimReminder(admin, {
      reminderType,
      referenceId: appointment.id,
      patientId: appointment.patient_id,
      scheduledFor,
    });

    if (!claimedId) {
      summary.skipped++;
      continue;
    }

    try {
      const { data: authUser, error: userError } = await admin.auth.admin.getUserById(
        appointment.patient_id
      );
      const email = authUser?.user?.email;
      if (userError || !email) {
        throw new Error(userError?.message ?? "Patient has no email on file.");
      }

      const { subject, html } = appointmentReminderEmail({
        patientName: nameById.get(appointment.patient_id) ?? "there",
        doctorName: nameById.get(appointment.doctor_id) ?? "your doctor",
        appointmentAt: new Date(appointment.appointment_at),
        reminderKind: reminderType === "appointment_24h" ? "24h" : "1h",
      });

      await sendReminderEmail(email, subject, html);
      await markReminderSent(admin, claimedId, email);
      summary.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markReminderFailed(admin, claimedId, message);
      summary.failed++;
    }
  }

  return NextResponse.json(summary);
}
