"use server";

import { createClient } from "@/lib/supabase/server";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";
import { todayInZone, addDaysToDateStr, zonedTimeToUtc } from "@/lib/reminders/timezone";
import { scheduledDosesInRange, type PrescriptionMedicineSchedule } from "@/lib/medication/doseSchedule";

export interface PatientDrawerMedicine {
  id: string;
  medicationName: string;
  dosage: string;
  frequencyCode: string;
}

export interface PatientDrawerRecord {
  id: string;
  recordType: string;
  notes: string;
  createdAt: string;
}

export interface PatientDrawerSummary {
  patientId: string;
  fullName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  allergies: string | null;
  bloodGroup: string | null;
  chronicConditions: string | null;
  abhaNumber: string | null;
  activeMedicines: PatientDrawerMedicine[];
  recentRecords: PatientDrawerRecord[];
  adherencePct: number | null;
  error?: string;
}

function emptySummary(patientId: string): PatientDrawerSummary {
  return {
    patientId,
    fullName: null,
    phone: null,
    dateOfBirth: null,
    gender: null,
    allergies: null,
    bloodGroup: null,
    chronicConditions: null,
    abhaNumber: null,
    activeMedicines: [],
    recentRecords: [],
    adherencePct: null,
  };
}

/**
 * Lightweight "peek" summary for the patient quick-view drawer — a smaller,
 * faster cousin of the full data load in
 * src/app/doctor/patients/[patientId]/page.tsx. Not meant to replace that
 * page, just to answer "who is this / anything urgent / what are they on"
 * without a full navigation.
 */
export async function getPatientDrawerSummary(patientId: string): Promise<PatientDrawerSummary> {
  if (!patientId) return { ...emptySummary(patientId), error: "Missing patient id." };

  const supabase = await createClient();

  const now = new Date();
  const today = todayInZone(now, REMINDER_TIMEZONE);
  const windowStart = addDaysToDateStr(today, -29); // 30-day adherence window

  const [{ data: profile, error: profileError }, { data: patient }, { data: medicinesRaw }, { data: records }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", patientId).single(),
      supabase
        .from("patients")
        .select("date_of_birth, gender, address, allergies, blood_group, chronic_conditions, abha_number")
        .eq("profile_id", patientId)
        .single(),
      supabase
        .from("prescription_medicines")
        .select(
          "id, medication_name, dosage, frequency_code, duration_days, start_date, prescriptions!inner(patient_id)"
        )
        .eq("prescriptions.patient_id", patientId),
      supabase
        .from("medical_records")
        .select("id, record_type, notes, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  if (profileError || !profile) {
    return { ...emptySummary(patientId), error: "Patient not found." };
  }

  const medicines = (medicinesRaw ?? []) as (PrescriptionMedicineSchedule & {
    medication_name: string;
    dosage: string;
  })[];

  const activeMedicines = medicines.filter((m) => {
    const activeEnd = addDaysToDateStr(m.start_date, m.duration_days - 1);
    return m.start_date <= today && today <= activeEnd;
  });

  // Simple combined 30-day adherence % across this patient's currently
  // active medicines only — same building block the doctor dashboard uses
  // (scheduledDosesInRange), just rolled into one number instead of a
  // per-day/per-medicine breakdown.
  let expectedTotal = 0;
  for (const medicine of activeMedicines) {
    const doses = scheduledDosesInRange(medicine, windowStart, today).filter((d) => d.getTime() <= now.getTime());
    expectedTotal += doses.length;
  }

  const activeMedicineIds = activeMedicines.map((m) => m.id);
  const { data: doseLogs } =
    activeMedicineIds.length > 0
      ? await supabase
          .from("dose_logs")
          .select("prescription_medicine_id")
          .in("prescription_medicine_id", activeMedicineIds)
          .gte("scheduled_for", zonedTimeToUtc(windowStart, "00:00", REMINDER_TIMEZONE).toISOString())
          .lte("scheduled_for", now.toISOString())
      : { data: [] as { prescription_medicine_id: string }[] };

  const takenTotal = (doseLogs ?? []).length;
  const adherencePct = expectedTotal > 0 ? Math.round((takenTotal / expectedTotal) * 100) : null;

  return {
    patientId,
    fullName: profile.full_name,
    phone: profile.phone,
    dateOfBirth: patient?.date_of_birth ?? null,
    gender: patient?.gender ?? null,
    allergies: patient?.allergies ?? null,
    bloodGroup: patient?.blood_group ?? null,
    chronicConditions: patient?.chronic_conditions ?? null,
    abhaNumber: patient?.abha_number ?? null,
    activeMedicines: activeMedicines.map((m) => ({
      id: m.id,
      medicationName: m.medication_name,
      dosage: m.dosage,
      frequencyCode: m.frequency_code,
    })),
    recentRecords: (records ?? []).map((r) => ({
      id: r.id,
      recordType: r.record_type,
      notes: r.notes,
      createdAt: r.created_at,
    })),
    adherencePct,
  };
}
