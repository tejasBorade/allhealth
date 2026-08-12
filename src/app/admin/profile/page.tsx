import PageHeader from "@/components/PageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function AdminProfilePage() {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <PageHeader title="My Profile" subtitle="Update your name and contact number." />
      <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
    </>
  );
}
