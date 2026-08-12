"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Empty strings from cleared optional fields should be stored as null, not
// "" — Supabase/Postgres and downstream UIs treat null and "" differently.
function nullableString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function updatePatientProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: nullableString(formData, "full_name"),
      phone: nullableString(formData, "phone"),
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  const { error: patientError } = await supabase
    .from("patients")
    .update({
      date_of_birth: nullableString(formData, "date_of_birth"),
      gender: nullableString(formData, "gender"),
      address: nullableString(formData, "address"),
      allergies: nullableString(formData, "allergies"),
      blood_group: nullableString(formData, "blood_group"),
      chronic_conditions: nullableString(formData, "chronic_conditions"),
      emergency_contact_name: nullableString(formData, "emergency_contact_name"),
      emergency_contact_phone: nullableString(formData, "emergency_contact_phone"),
      abha_number: nullableString(formData, "abha_number"),
    })
    .eq("profile_id", user.id);

  if (patientError) return { error: patientError.message };

  revalidatePath("/patient/profile");
  return { success: true };
}
