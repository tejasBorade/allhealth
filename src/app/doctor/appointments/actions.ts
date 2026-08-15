"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/resend";
import { visitReportEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site";
import type { AppointmentStatus } from "@/lib/supabase/types";

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/doctor/appointments");
}

function toNullableInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function toNullableFloat(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

export async function completeAppointmentWithReport(appointmentId: string, formData: FormData) {
  const supabase = await createClient();

  const update = {
    status: "completed" as const,
    chief_complaint: toNullableText(formData.get("chief_complaint")),
    bp_systolic: toNullableInt(formData.get("bp_systolic")),
    bp_diastolic: toNullableInt(formData.get("bp_diastolic")),
    pulse_bpm: toNullableInt(formData.get("pulse_bpm")),
    weight_kg: toNullableFloat(formData.get("weight_kg")),
    advice: toNullableText(formData.get("advice")),
  };

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update(update)
    .eq("id", appointmentId)
    .select("id, patient_id, doctor_id, appointment_at")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/doctor/appointments");

  // Best-effort: the visit is already marked completed regardless of whether
  // the email succeeds — a failed send shouldn't block the doctor's workflow
  // or surface as if completion itself failed.
  try {
    const admin = createAdminClient();
    const [{ data: authUser }, { data: doctorProfile }, { data: patientProfile }, { data: doctor }, { data: prescription }] =
      await Promise.all([
        admin.auth.admin.getUserById(appointment.patient_id),
        supabase.from("profiles").select("full_name").eq("id", appointment.doctor_id).single(),
        supabase.from("profiles").select("full_name").eq("id", appointment.patient_id).single(),
        supabase.from("doctors").select("clinic_name").eq("profile_id", appointment.doctor_id).single(),
        supabase
          .from("prescriptions")
          .select("diagnosis, follow_up_date, prescription_medicines(medication_name, dosage, frequency_code)")
          .eq("appointment_id", appointmentId)
          .maybeSingle(),
      ]);

    const email = authUser?.user?.email;
    if (email) {
      const { subject, html } = visitReportEmail({
        patientName: patientProfile?.full_name ?? "there",
        doctorName: doctorProfile?.full_name ?? "your doctor",
        clinicName: doctor?.clinic_name ?? null,
        appointmentAt: new Date(appointment.appointment_at),
        chiefComplaint: update.chief_complaint,
        diagnosis: prescription?.diagnosis ?? null,
        medicines: prescription?.prescription_medicines ?? [],
        followUpDate: prescription?.follow_up_date ?? null,
        reportUrl: `${getSiteUrl()}/appointments/${appointmentId}/report`,
      });
      await sendReminderEmail(email, subject, html);
    }
  } catch (emailError) {
    console.error("completeAppointmentWithReport: failed to send visit report email", emailError);
  }
}
