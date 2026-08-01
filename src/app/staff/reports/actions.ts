"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadReport(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const reportType = formData.get("reportType") as string;
  const file = formData.get("file") as File | null;

  if (!patientId || !reportType || !file || file.size === 0) {
    return { error: "Pick a patient, a report type, and a file." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const storagePath = `${patientId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("medical-reports")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("medical_reports").insert({
    patient_id: patientId,
    uploaded_by: user.id,
    storage_path: storagePath,
    report_type: reportType,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/staff/reports");
  return { success: true };
}
