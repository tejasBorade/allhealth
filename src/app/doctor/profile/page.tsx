import PageHeader from "@/components/PageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function DoctorProfilePage() {
  const { user } = await requireRole(["doctor"]);

  const supabase = await createClient();
  const [{ data: profile }, { data: doctor }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase
      .from("doctors")
      .select("specialization, clinic_name, bio, registration_number, qualifications, clinic_address, clinic_phone")
      .eq("profile_id", user.id)
      .single(),
  ]);

  return (
    <>
      <PageHeader title="My Profile" subtitle="Update your personal and clinic details." />
      <ProfileForm
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
        specialization={doctor?.specialization ?? ""}
        clinicName={doctor?.clinic_name ?? ""}
        bio={doctor?.bio ?? ""}
        registrationNumber={doctor?.registration_number ?? ""}
        qualifications={doctor?.qualifications ?? ""}
        clinicAddress={doctor?.clinic_address ?? ""}
        clinicPhone={doctor?.clinic_phone ?? ""}
      />
    </>
  );
}
