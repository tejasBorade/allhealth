"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDoctorProfile(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const specialization = formData.get("specialization") as string;
  const clinicName = formData.get("clinicName") as string;
  const bio = formData.get("bio") as string;
  const qualifications = formData.get("qualifications") as string;
  const registrationNumber = formData.get("registrationNumber") as string;
  const clinicAddress = formData.get("clinicAddress") as string;
  const clinicPhone = formData.get("clinicPhone") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  const { error: doctorError } = await supabase
    .from("doctors")
    .update({
      specialization: specialization || null,
      clinic_name: clinicName || null,
      bio: bio || null,
      qualifications: qualifications || null,
      registration_number: registrationNumber || null,
      clinic_address: clinicAddress || null,
      clinic_phone: clinicPhone || null,
    })
    .eq("profile_id", user.id);

  if (doctorError) return { error: doctorError.message };

  revalidatePath("/doctor/profile");
  return { success: true };
}
