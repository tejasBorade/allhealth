import PageHeader from "@/components/PageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function PatientProfilePage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const [{ data: profile }, { data: patient }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, data_consent_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("patients")
      .select(
        "date_of_birth, gender, address, allergies, blood_group, chronic_conditions, emergency_contact_name, emergency_contact_phone, abha_number"
      )
      .eq("profile_id", user.id)
      .single(),
  ]);

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Keep your personal and medical details up to date."
      />
      <ProfileForm profile={profile} patient={patient} />
    </>
  );
}
