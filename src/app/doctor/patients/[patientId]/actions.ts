"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addMedicalRecord(patientId: string, formData: FormData) {
  const recordType = formData.get("recordType") as string;
  const notes = formData.get("notes") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("medical_records").insert({
    patient_id: patientId,
    author_id: user.id,
    record_type: recordType,
    notes,
  });

  if (error) return { error: error.message };
  revalidatePath(`/doctor/patients/${patientId}`);
  return { success: true };
}

interface MedicineInput {
  medicationName: string;
  dosage: string;
  frequencyCode: string;
  durationDays: number;
}

export async function createPrescription(
  patientId: string,
  data: { followUpDate: string | null; notes: string; medicines: MedicineInput[] }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: patientId,
      doctor_id: user.id,
      follow_up_date: data.followUpDate || null,
      notes: data.notes || null,
    })
    .select("id")
    .single();

  if (error || !prescription) return { error: error?.message ?? "Failed to create prescription." };

  const { error: medicinesError } = await supabase.from("prescription_medicines").insert(
    data.medicines.map((med) => ({
      prescription_id: prescription.id,
      medication_name: med.medicationName,
      dosage: med.dosage,
      frequency_code: med.frequencyCode,
      duration_days: med.durationDays,
    }))
  );

  if (medicinesError) return { error: medicinesError.message };

  revalidatePath(`/doctor/patients/${patientId}`);
  return { success: true };
}
