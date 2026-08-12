"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/supabase/types";

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("medical_reports").update({ status }).eq("id", reportId);
  if (error) throw new Error(error.message);
  revalidatePath("/doctor/reports");
}
