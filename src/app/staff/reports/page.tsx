import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import UploadReportForm from "./UploadReportForm";

export default async function StaffReportsPage() {
  await requireRole(["staff"]);
  const supabase = await createClient();

  const [{ data: patients }, { data: reports, error }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "patient"),
    supabase
      .from("medical_reports")
      .select("id, report_type, status, uploaded_at, patients(profiles(full_name))")
      .order("uploaded_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Medical reports"
        subtitle="Upload lab reports, scans, and other documents for patients."
      />

      <UploadReportForm patients={patients ?? []} />

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(reports ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState
                    icon={FolderOpenOutlinedIcon}
                    title="No reports uploaded yet"
                    description="Reports you upload for patients will appear here."
                  />
                </TableCell>
              </TableRow>
            )}
            {(reports ?? []).map((report) => {
              const patient = Array.isArray(report.patients)
                ? report.patients[0]
                : report.patients;
              const profile = patient
                ? Array.isArray(patient.profiles)
                  ? patient.profiles[0]
                  : patient.profiles
                : null;
              return (
                <TableRow key={report.id}>
                  <TableCell>{profile?.full_name ?? "Unknown"}</TableCell>
                  <TableCell>
                    <Chip label={report.report_type} size="small" />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={report.status} />
                  </TableCell>
                  <TableCell>{new Date(report.uploaded_at).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
