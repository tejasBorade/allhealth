import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

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
        .select("id, report_type, storage_path, uploaded_at")
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
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Medical records
      </Typography>

      {(recordsError || reportsError) && (
        <Typography color="error">
          {recordsError?.message ?? reportsError?.message}
        </Typography>
      )}

      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
        Notes
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {(records ?? []).length === 0 && (
          <Typography color="text.secondary">No records yet.</Typography>
        )}
        {(records ?? []).map((record) => (
          <Card key={record.id} variant="outlined">
            <CardContent>
              <Chip label={record.record_type} size="small" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {new Date(record.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {record.notes}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Typography variant="h6" gutterBottom>
        Uploaded reports
      </Typography>
      <Stack spacing={1.5}>
        {reportLinks.length === 0 && (
          <Typography color="text.secondary">No reports uploaded yet.</Typography>
        )}
        {reportLinks.map((report) => (
          <Card key={report.id} variant="outlined">
            <CardContent
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <Chip label={report.report_type} size="small" sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {new Date(report.uploaded_at).toLocaleDateString()}
                </Typography>
              </div>
              {report.url && (
                <Link href={report.url} target="_blank" rel="noopener noreferrer">
                  View
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );
}
