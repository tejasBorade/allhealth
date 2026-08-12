import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";

export default async function PatientMedicalRecordsPage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const [{ data: records, error: recordsError }, { data: reports, error: reportsError }] =
    await Promise.all([
      supabase
        .from("medical_records")
        .select("id, record_type, notes, created_at")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("medical_reports")
        .select("id, report_type, status, storage_path, uploaded_at")
        .eq("patient_id", user.id)
        .order("uploaded_at", { ascending: false }),
    ]);

  const reportLinks = await Promise.all(
    (reports ?? []).map(async (report) => {
      const { data } = await supabase.storage
        .from("medical-reports")
        .createSignedUrl(report.storage_path, 60 * 10);
      return { ...report, url: data?.signedUrl ?? null };
    })
  );

  return (
    <>
      <PageHeader
        title="Medical records"
        subtitle="Doctor notes and uploaded reports from your visits, all in one place."
      />

      {(recordsError || reportsError) && (
        <Typography color="error">
          {recordsError?.message ?? reportsError?.message}
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
        <DescriptionRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="h6">Notes</Typography>
      </Stack>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {(records ?? []).length === 0 ? (
          <EmptyState
            icon={DescriptionRoundedIcon}
            title="No records yet"
            description="Notes your doctor adds during visits will appear here."
          />
        ) : (
          (records ?? []).map((record) => (
            <Card key={record.id} variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Chip
                    label={record.record_type}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.dark,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(record.created_at).toLocaleDateString()}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  {record.notes}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
        <InsertDriveFileRoundedIcon sx={{ color: "secondary.main", fontSize: 20 }} />
        <Typography variant="h6">Uploaded reports</Typography>
      </Stack>
      <Stack spacing={1.5}>
        {reportLinks.length === 0 ? (
          <EmptyState
            icon={InsertDriveFileRoundedIcon}
            title="No reports uploaded yet"
            description="Lab results and scans shared by your doctor will show up here."
          />
        ) : (
          reportLinks.map((report) => (
            <Card key={report.id} variant="outlined">
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <Chip
                      label={report.report_type}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        color: theme.palette.secondary.dark,
                      }}
                    />
                    <StatusChip status={report.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(report.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Box>
                {report.url && (
                  <Button
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                    sx={{ flexShrink: 0 }}
                  >
                    View
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </>
  );
}
