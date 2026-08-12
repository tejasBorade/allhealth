"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markDoseTaken(prescriptionMedicineId: string, scheduledForIso: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("dose_logs").insert({
    prescription_medicine_id: prescriptionMedicineId,
    patient_id: user.id,
    scheduled_for: scheduledForIso,
  });

  // A double-click on an already-taken dose hits the unique constraint —
  // treat that as a harmless no-op rather than surfacing an error.
  if (error && !error.message.includes("duplicate key")) {
    throw new Error(error.message);
  }

  revalidatePath("/patient");
}
