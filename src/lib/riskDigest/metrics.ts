import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { scheduledDosesInRange, type PrescriptionMedicineSchedule } from "@/lib/medication/doseSchedule";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";
import { todayInZone, addDaysToDateStr, zonedTimeToUtc } from "@/lib/reminders/timezone";

// MVP heuristics tuned to surface patients worth a second look — not
// clinical guidelines. The AI never decides who gets flagged; these
// deterministic, auditable rules do.
const ADHERENCE_FLAG_BELOW = 70;
const ADHERENCE_DROP_FLAG = 15;
const BP_SYSTOLIC_DELTA_FLAG = 10;
const BP_DIASTOLIC_DELTA_FLAG = 8;
const WEIGHT_DELTA_KG_FLAG = 3;

export interface PatientRiskMetrics {
  patientId: string;
  fullName: string;
  adherencePctRecent: number | null;
  adherencePctPrior: number | null;
  vitalsFlag: boolean;
  vitalsNote: string | null;
  chronicConditions: string[];
  flagged: boolean;
}

type MedicineForSchedule = PrescriptionMedicineSchedule & {
  prescriptions: { doctor_id: string; patient_id: string };
};

interface VitalsRow {
  patient_id: string;
  appointment_at: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_bpm: number | null;
  weight_kg: number | null;
}

/**
 * Per-patient adherence trend (last 14 days vs. the 14 before that) + a
 * simple vitals-trend note across the last up-to-3 completed appointments,
 * for every patient this doctor has appointed or prescribed to. Reuses the
 * same scheduledDosesInRange building block as the doctor dashboard's
 * aggregate adherence widgets and getPatientDrawerSummary's single-patient
 * number — this is the first place that breaks it down per patient with a
 * trend, rather than one point-in-time aggregate.
 */
export async function computeRiskMetricsForDoctor(
  supabase: SupabaseClient<Database>,
  doctorId: string
): Promise<PatientRiskMetrics[]> {
  const now = new Date();
  const today = todayInZone(now, REMINDER_TIMEZONE);
  const recentStart = addDaysToDateStr(today, -13);
  const priorStart = addDaysToDateStr(today, -27);
  const priorEnd = addDaysToDateStr(today, -14);

  const [{ data: fromAppointments }, { data: fromPrescriptions }] = await Promise.all([
    supabase.from("appointments").select("patient_id").eq("doctor_id", doctorId),
    supabase.from("prescriptions").select("patient_id").eq("doctor_id", doctorId),
  ]);
  const patientIds = Array.from(
    new Set([
      ...(fromAppointments ?? []).map((r) => r.patient_id),
      ...(fromPrescriptions ?? []).map((r) => r.patient_id),
    ])
  );
  if (patientIds.length === 0) return [];

  const [{ data: profiles }, { data: patientRows }, { data: medicinesRaw }, { data: vitalsRows }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", patientIds),
      supabase.from("patients").select("profile_id, chronic_conditions").in("profile_id", patientIds),
      supabase
        .from("prescription_medicines")
        .select("id, frequency_code, duration_days, start_date, prescriptions!inner(doctor_id, patient_id)")
        .eq("prescriptions.doctor_id", doctorId)
        .in("prescriptions.patient_id", patientIds),
      supabase
        .from("appointments")
        .select("patient_id, appointment_at, bp_systolic, bp_diastolic, pulse_bpm, weight_kg")
        .eq("doctor_id", doctorId)
        .eq("status", "completed")
        .in("patient_id", patientIds)
        .order("appointment_at", { ascending: true }),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown patient"]));
  const conditionsById = new Map(
    (patientRows ?? []).map((p) => [
      p.profile_id,
      (p.chronic_conditions ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    ])
  );

  const medicines = (medicinesRaw ?? []) as MedicineForSchedule[];
  const medicinesByPatient = new Map<string, MedicineForSchedule[]>();
  for (const medicine of medicines) {
    const pid = medicine.prescriptions.patient_id;
    const list = medicinesByPatient.get(pid) ?? [];
    list.push(medicine);
    medicinesByPatient.set(pid, list);
  }

  const vitalsByPatient = new Map<string, VitalsRow[]>();
  for (const row of (vitalsRows ?? []) as VitalsRow[]) {
    if (row.bp_systolic === null && row.bp_diastolic === null && row.pulse_bpm === null && row.weight_kg === null) {
      continue;
    }
    const list = vitalsByPatient.get(row.patient_id) ?? [];
    list.push(row);
    vitalsByPatient.set(row.patient_id, list);
  }

  const medicineIds = medicines.map((m) => m.id);
  const { data: doseLogs } =
    medicineIds.length > 0
      ? await supabase
          .from("dose_logs")
          .select("prescription_medicine_id, scheduled_for")
          .in("prescription_medicine_id", medicineIds)
          .gte("scheduled_for", zonedTimeToUtc(priorStart, "00:00", REMINDER_TIMEZONE).toISOString())
          .lte("scheduled_for", now.toISOString())
      : { data: [] as { prescription_medicine_id: string; scheduled_for: string }[] };

  const takenByMedicineRecent = new Map<string, number>();
  const takenByMedicinePrior = new Map<string, number>();
  for (const log of doseLogs ?? []) {
    const day = todayInZone(new Date(log.scheduled_for), REMINDER_TIMEZONE);
    if (day >= recentStart) {
      takenByMedicineRecent.set(
        log.prescription_medicine_id,
        (takenByMedicineRecent.get(log.prescription_medicine_id) ?? 0) + 1
      );
    } else if (day >= priorStart && day <= priorEnd) {
      takenByMedicinePrior.set(
        log.prescription_medicine_id,
        (takenByMedicinePrior.get(log.prescription_medicine_id) ?? 0) + 1
      );
    }
  }

  const results: PatientRiskMetrics[] = [];
  for (const patientId of patientIds) {
    const patientMedicines = medicinesByPatient.get(patientId) ?? [];

    let expectedRecent = 0;
    let takenRecent = 0;
    let expectedPrior = 0;
    let takenPrior = 0;
    for (const medicine of patientMedicines) {
      const recentDoses = scheduledDosesInRange(medicine, recentStart, today).filter(
        (d) => d.getTime() <= now.getTime()
      );
      expectedRecent += recentDoses.length;
      takenRecent += takenByMedicineRecent.get(medicine.id) ?? 0;

      const priorDoses = scheduledDosesInRange(medicine, priorStart, priorEnd);
      expectedPrior += priorDoses.length;
      takenPrior += takenByMedicinePrior.get(medicine.id) ?? 0;
    }

    const adherencePctRecent = expectedRecent > 0 ? Math.round((takenRecent / expectedRecent) * 100) : null;
    const adherencePctPrior = expectedPrior > 0 ? Math.round((takenPrior / expectedPrior) * 100) : null;

    const adherenceFlag =
      adherencePctRecent !== null &&
      (adherencePctRecent < ADHERENCE_FLAG_BELOW ||
        (adherencePctPrior !== null && adherencePctPrior - adherencePctRecent >= ADHERENCE_DROP_FLAG));

    const vitalsHistory = (vitalsByPatient.get(patientId) ?? []).slice(-3);
    let vitalsFlag = false;
    const vitalsNotes: string[] = [];
    if (vitalsHistory.length >= 2) {
      const first = vitalsHistory[0];
      const last = vitalsHistory[vitalsHistory.length - 1];

      if (first.bp_systolic !== null && last.bp_systolic !== null && first.bp_diastolic !== null && last.bp_diastolic !== null) {
        const sysDelta = last.bp_systolic - first.bp_systolic;
        const diaDelta = last.bp_diastolic - first.bp_diastolic;
        if (sysDelta >= BP_SYSTOLIC_DELTA_FLAG || diaDelta >= BP_DIASTOLIC_DELTA_FLAG) {
          vitalsFlag = true;
          vitalsNotes.push(
            `BP up from ${first.bp_systolic}/${first.bp_diastolic} to ${last.bp_systolic}/${last.bp_diastolic} over the last ${vitalsHistory.length} visits`
          );
        }
      }

      if (first.weight_kg !== null && last.weight_kg !== null) {
        const weightDelta = Number(last.weight_kg) - Number(first.weight_kg);
        if (Math.abs(weightDelta) >= WEIGHT_DELTA_KG_FLAG) {
          vitalsFlag = true;
          const direction = weightDelta > 0 ? "up" : "down";
          vitalsNotes.push(
            `Weight ${direction} from ${first.weight_kg}kg to ${last.weight_kg}kg over the last ${vitalsHistory.length} visits`
          );
        }
      }
    }

    results.push({
      patientId,
      fullName: nameById.get(patientId) ?? "Unknown patient",
      adherencePctRecent,
      adherencePctPrior,
      vitalsFlag,
      vitalsNote: vitalsNotes.length > 0 ? vitalsNotes.join("; ") : null,
      chronicConditions: conditionsById.get(patientId) ?? [],
      flagged: adherenceFlag || vitalsFlag,
    });
  }

  return results;
}
