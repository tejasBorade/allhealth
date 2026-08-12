import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/reminders/cronAuth";
import {
  claimReminder,
  markReminderSent,
  markReminderFailed,
  reapStalePendingReminders,
} from "@/lib/reminders/log";
import { REMINDER_TIMEZONE, DOSE_GRACE_MS, PENDING_STALE_MS } from "@/lib/reminders/constants";
import { zonedTimeToUtc, todayInZone, addDaysToDateStr } from "@/lib/reminders/timezone";
import { parseFrequencyCode } from "@/lib/reminders/frequency";
import { sendReminderEmail } from "@/lib/email/resend";
import { medicationDoseReminderEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const today = todayInZone(now, REMINDER_TIMEZONE);
  const yesterday = addDaysToDateStr(today, -1);

  const summary = { checked: 0, sent: 0, skipped: 0, failed: 0, reaped: 0 };

  // Sweep any 'pending' claims orphaned by a previous invocation that died
  // mid-loop (e.g. hit maxDuration) before this tick attempts new claims —
  // otherwise those reminders would be permanently unretriable, since only
  // 'failed' rows are excluded from reminder_log_claim_idx.
  summary.reaped = await reapStalePendingReminders(admin, PENDING_STALE_MS);

  // This filter only bounds the query (start_date must have already begun);
  // the full [start_date, activeEnd] active-window check happens below in
  // application code, since duration_days can't be pushed into a single
  // column comparison here.
  const { data: medicines, error } = await admin
    .from("prescription_medicines")
    .select("id, prescription_id, medication_name, dosage, frequency_code, duration_days, start_date")
    .lte("start_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  summary.checked = medicines?.length ?? 0;

  if (!medicines || medicines.length === 0) {
    return NextResponse.json(summary);
  }

  // Batch-fetch the owning prescriptions once for the whole run (rather
  // than once per candidate dose) and build a prescription_id -> patient_id
  // lookup.
  const prescriptionIds = Array.from(new Set(medicines.map((m) => m.prescription_id)));
  const { data: prescriptions } = await admin
    .from("prescriptions")
    .select("id, patient_id")
    .in("id", prescriptionIds);
  const patientIdByPrescriptionId = new Map((prescriptions ?? []).map((p) => [p.id, p.patient_id]));

  const nowMs = now.getTime();

  type DueDose = {
    medicine: (typeof medicines)[number];
    patientId: string;
    doseAt: Date;
  };
  const dueDoses: DueDose[] = [];

  for (const medicine of medicines) {
    const patientId = patientIdByPrescriptionId.get(medicine.prescription_id);
    if (!patientId) continue; // orphaned medicine row; skip defensively

    const activeEnd = addDaysToDateStr(medicine.start_date, medicine.duration_days - 1);

    // Check both today and yesterday (in REMINDER_TIMEZONE) against the
    // medicine's active window: a late-night slot like HS's 22:00 plus the
    // grace window can cross local midnight, so checking only "today" would
    // silently miss a dose that occurred just before midnight if the cron
    // catches up shortly after.
    for (const candidateDate of [yesterday, today]) {
      if (candidateDate < medicine.start_date || candidateDate > activeEnd) continue;

      const times = parseFrequencyCode(medicine.frequency_code);
      for (const time of times) {
        const doseAt = zonedTimeToUtc(candidateDate, time, REMINDER_TIMEZONE);
        const doseAtMs = doseAt.getTime();
        const isDue = doseAtMs <= nowMs && nowMs - doseAtMs <= DOSE_GRACE_MS;
        if (isDue) {
          dueDoses.push({ medicine, patientId, doseAt });
        }
      }
    }
  }

  if (dueDoses.length === 0) {
    return NextResponse.json(summary);
  }

  const patientIds = Array.from(new Set(dueDoses.map((d) => d.patientId)));
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", patientIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "there"]));

  for (const { medicine, patientId, doseAt } of dueDoses) {
    const claimedId = await claimReminder(admin, {
      reminderType: "medication_dose",
      referenceId: medicine.id,
      patientId,
      scheduledFor: doseAt,
    });

    if (!claimedId) {
      summary.skipped++;
      continue;
    }

    try {
      const { data: authUser, error: userError } = await admin.auth.admin.getUserById(patientId);
      const email = authUser?.user?.email;
      if (userError || !email) {
        throw new Error(userError?.message ?? "Patient has no email on file.");
      }

      const { subject, html } = medicationDoseReminderEmail({
        patientName: nameById.get(patientId) ?? "there",
        medicationName: medicine.medication_name,
        dosage: medicine.dosage,
        doseAt,
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
