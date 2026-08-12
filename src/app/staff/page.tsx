import Grid from "@mui/material/Grid";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import FolderSharedRoundedIcon from "@mui/icons-material/FolderSharedRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function StaffDashboard() {
  const { profile } = await requireRole(["staff"]);
  const supabase = await createClient();

  const [{ count: pendingBills }, { count: reportsUploaded }, { count: totalPatients }] =
    await Promise.all([
      supabase
        .from("billing")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("medical_reports").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient"),
    ]);

  return (
    <>
      <PageHeader
        title={`Welcome${profile.full_name ? `, ${profile.full_name}` : ""}`}
        subtitle="Use the sidebar to manage patient billing and upload medical reports."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Pending bills"
            value={pendingBills ?? 0}
            icon={ReceiptLongRoundedIcon}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Reports uploaded"
            value={reportsUploaded ?? 0}
            icon={FolderSharedRoundedIcon}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Total patients"
            value={totalPatients ?? 0}
            icon={GroupRoundedIcon}
            color="primary"
          />
        </Grid>
      </Grid>
    </>
  );
}
