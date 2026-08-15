import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { computeRiskMetricsForDoctor } from "./metrics";
import { summarizeFlaggedPatients, type FlaggedPatientInput } from "./summarize";

/**
 * Computes this doctor's patient risk metrics, gets AI summaries for the
 * flagged subset (best-effort — see summarizeFlaggedPatients), and upserts
 * one row per patient into patient_risk_digests. Shared by the daily cron
 * route (admin client, looped over every doctor) and the doctor's own
 * on-demand "Refresh" action (their own RLS-scoped client, just themselves).
 */
export async function computeAndStoreRiskDigest(
  supabase: SupabaseClient<Database>,
  doctorId: string
): Promise<{ patientsChecked: number; flagged: number }> {
  const metrics = await computeRiskMetricsForDoctor(supabase, doctorId);
  const flaggedMetrics = metrics.filter((m) => m.flagged);

  const flaggedInputs: FlaggedPatientInput[] = flaggedMetrics.map((m) => ({
    ref: m.patientId,
    adherencePctRecent: m.adherencePctRecent,
    adherencePctPrior: m.adherencePctPrior,
    vitalsNote: m.vitalsNote,
    chronicConditions: m.chronicConditions,
  }));
  const summaries = await summarizeFlaggedPatients(flaggedInputs);

  if (metrics.length === 0) return { patientsChecked: 0, flagged: 0 };

  const rows = metrics.map((m) => {
    const summary = summaries.get(m.patientId);
    return {
      doctor_id: doctorId,
      patient_id: m.patientId,
      computed_at: new Date().toISOString(),
      flagged: m.flagged,
      adherence_pct_recent: m.adherencePctRecent,
      adherence_pct_prior: m.adherencePctPrior,
      vitals_flag: m.vitalsFlag,
      vitals_note: m.vitalsNote,
      summary_text: summary?.summary ?? null,
      suggested_action: summary?.suggestedAction ?? null,
      dismissed_at: null,
    };
  });

  const { error } = await supabase
    .from("patient_risk_digests")
    .upsert(rows, { onConflict: "doctor_id,patient_id" });
  if (error) throw new Error(error.message);

  return { patientsChecked: metrics.length, flagged: flaggedMetrics.length };
}
