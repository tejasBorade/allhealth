import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/reminders/cronAuth";
import { computeAndStoreRiskDigest } from "@/lib/riskDigest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: doctors, error } = await admin.from("profiles").select("id").eq("role", "doctor");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = { doctorsChecked: 0, patientsChecked: 0, flagged: 0, failed: 0 };

  for (const doctor of doctors ?? []) {
    try {
      const result = await computeAndStoreRiskDigest(admin, doctor.id);
      summary.doctorsChecked++;
      summary.patientsChecked += result.patientsChecked;
      summary.flagged += result.flagged;
    } catch (err) {
      console.error(`risk-digest: failed for doctor ${doctor.id}`, err);
      summary.failed++;
    }
  }

  return NextResponse.json(summary);
}
