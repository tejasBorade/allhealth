import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReminderType } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

interface ClaimReminderParams {
  reminderType: ReminderType;
  referenceId: string;
  patientId: string;
  scheduledFor: Date;
}

/**
 * Claim-then-send idempotency: inserts a 'pending' reminder_log row as the
 * claim. Returns the claimed row's id on success, or null if some other
 * (possibly concurrent) cron invocation already claimed this exact
 * (reminder_type, reference_id, scheduled_for) — a Postgres 23505
 * unique-violation on reminder_log_claim_idx. Any other error is unexpected
 * and is re-thrown rather than swallowed.
 */
export async function claimReminder(
  admin: AdminClient,
  params: ClaimReminderParams
): Promise<string | null> {
  const { data, error } = await admin
    .from("reminder_log")
    .insert({
      reminder_type: params.reminderType,
      reference_id: params.referenceId,
      patient_id: params.patientId,
      scheduled_for: params.scheduledFor.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }

  return data.id;
}

export async function markReminderSent(admin: AdminClient, id: string, emailTo: string) {
  await admin
    .from("reminder_log")
    .update({ status: "sent", email_to: emailTo, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markReminderFailed(admin: AdminClient, id: string, errorMessage: string) {
  await admin
    .from("reminder_log")
    .update({ status: "failed", error: errorMessage, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * Sweeps orphaned claims: a 'pending' row can only still exist this long
 * after being claimed if the invocation that claimed it died (e.g. hit the
 * cron route's maxDuration) before ever calling markReminderSent/Failed.
 * `reminder_log_claim_idx` only excludes 'failed' rows from its uniqueness
 * check, so a stuck 'pending' row would otherwise block claimReminder() for
 * that exact (reminder_type, reference_id, scheduled_for) forever. Flipping
 * it to 'failed' here frees that key up so a later cron tick can re-claim
 * and retry it. Should be called once near the start of each cron route,
 * before any new claims are attempted in the same invocation.
 */
export async function reapStalePendingReminders(
  admin: AdminClient,
  olderThanMs: number
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();

  const { data, error } = await admin
    .from("reminder_log")
    .update({
      status: "failed",
      error: "Reaped: stuck in pending past the staleness window, presumed orphaned by a killed/timed-out cron invocation.",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) throw error;

  return data?.length ?? 0;
}
