"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Relies on RLS (profiles_update_admin + prevent_self_role_change) to reject
// this for anyone whose session isn't an approved admin — no manual role
// check needed here.
export async function approveProfile(profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ approved: true })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
