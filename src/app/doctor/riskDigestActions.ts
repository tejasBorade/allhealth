"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { computeAndStoreRiskDigest } from "@/lib/riskDigest/run";

export async function refreshRiskDigest() {
  const { user } = await requireRole(["doctor"]);
  const supabase = await createClient();
  await computeAndStoreRiskDigest(supabase, user.id);
  revalidatePath("/doctor");
}

export async function dismissRiskDigestRow(id: string) {
  await requireRole(["doctor"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_risk_digests")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/doctor");
}
