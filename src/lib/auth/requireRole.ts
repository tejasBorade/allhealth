import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// Server-side role gate for a role-scoped route segment (e.g. src/app/doctor/layout.tsx).
// RLS is the real security boundary; this only decides where to redirect a
// signed-in-but-wrong-role or not-yet-approved user so they don't hit a blank page.
export async function requireRole(allowed: UserRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, approved")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const typedProfile = profile as Profile;

  if (!allowed.includes(typedProfile.role)) redirect("/unauthorized");
  if (typedProfile.role !== "patient" && !typedProfile.approved) {
    redirect("/pending-approval");
  }

  return { user, profile: typedProfile };
}
