"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/lib/supabase/types";

export async function createBill(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const amount = Number(formData.get("amount"));

  if (!patientId || !amount || amount <= 0) {
    return { error: "Pick a patient and enter a valid amount." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("billing").insert({
    patient_id: patientId,
    amount,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/staff/billing");
  return { success: true };
}

export async function updateBillStatus(billId: string, status: BillingStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("billing").update({ status }).eq("id", billId);
  if (error) throw new Error(error.message);
  revalidatePath("/staff/billing");
}
