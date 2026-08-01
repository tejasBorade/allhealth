"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function bookAppointment(formData: FormData) {
  const doctorId = formData.get("doctorId") as string;
  const appointmentAt = formData.get("appointmentAt") as string;

  if (!doctorId || !appointmentAt) {
    return { error: "Pick a doctor and a time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("appointments").insert({
    patient_id: user.id,
    doctor_id: doctorId,
    appointment_at: new Date(appointmentAt).toISOString(),
  });

  if (error) {
    // Postgres exclusion-constraint violation (double-booked slot) surfaces as 23P01.
    if (error.code === "23P01") {
      return { error: "That slot was just taken — pick another time." };
    }
    return { error: error.message };
  }

  revalidatePath("/patient/appointments");
  return { success: true };
}
