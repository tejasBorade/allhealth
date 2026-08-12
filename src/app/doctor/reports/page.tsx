import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/supabase/types";
import { updateReportStatus } from "./actions";

const FILTERS: { label: string; value: "all" | ReportStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Critical", value: "critical" },
  { label: "Reviewed", value: "reviewed" },
];

export default async function DoctorReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user } = await requireRole(["doctor"]);
  const { status } = await searchParams;
  const activeStatus = (FILTERS.some((f) => f.value === status) ? status : "all") as
    | "all"
    | ReportStatus;

  const supabase = await createClient();

  // No single UNION query via the JS client — merge the two relationship
  // sources (appointments, prescriptions) client-side instead.
  const [{ data: fromAppointments }, { data: fromPrescriptions }] = await Promise.all([
    supabase.from("appointments").select("patient_id").eq("doctor_id", user.id),
    supabase.from("prescriptions").select("patient_id").eq("doctor_id", user.id),
  ]);

  const patientIds = Array.from(
    new Set([
      ...(fromAppointments ?? []).map((row) => row.patient_id),
      ...(fromPrescriptions ?? []).map((row) => row.patient_id),
    ])
  );

  let reportsQuery = supabase
    .from("medical_reports")
    .select("id, report_type, status, uploaded_at, patient_id, patients(profiles(full_name))")
    .in("patient_id", patientIds)
    .order("uploaded_at", { ascending: false });

  if (activeStatus !== "all") {
    reportsQuery = reportsQuery.eq("status", activeStatus);
  }

  const { data: reports, error } =
    patientIds.length > 0 ? await reportsQuery : { data: [], error: null };

  return (
    <>
      <PageHeader title="Lab Reports Inbox" subtitle="Review reports uploaded for your patients." />

      <Tabs value={activeStatus} sx={{ mb: 2 }}>
        {FILTERS.map((f) => (
          <Tab
            key={f.value}
            label={f.label}
            value={f.value}
            component="a"
            href={`/doctor/reports?status=${f.value}`}
          />
        ))}
      </Tabs>

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(reports ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={ScienceOutlinedIcon}
                    title="No lab reports found"
                    description="Reports uploaded for your patients will appear here."
                  />
                </TableCell>
              </TableRow>
            )}
            {(reports ?? []).map((report) => {
              const patient = Array.isArray(report.patients) ? report.patients[0] : report.patients;
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
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {report.status !== "reviewed" && (
                        <form action={updateReportStatus.bind(null, report.id, "reviewed")}>
                          <Button type="submit" size="small" variant="outlined">
                            Mark reviewed
                          </Button>
                        </form>
                      )}
                      {report.status !== "critical" && (
                        <form action={updateReportStatus.bind(null, report.id, "critical")}>
                          <Button type="submit" size="small" color="error" variant="outlined">
                            Flag critical
                          </Button>
                        </form>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
