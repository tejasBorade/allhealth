import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { updateAppointmentStatus } from "./actions";

export default async function DoctorAppointmentsPage() {
  const { user } = await requireRole(["doctor"]);

  const supabase = await createClient();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, appointment_at, status, patients(profiles(full_name))")
    .eq("doctor_id", user.id)
    .order("appointment_at", { ascending: true });

  return (
    <>
      <PageHeader title="Your appointments" />

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>When</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(appointments ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState
                    icon={EventOutlinedIcon}
                    title="No appointments yet"
                    description="Appointments booked with you will show up here."
                  />
                </TableCell>
              </TableRow>
            )}
            {(appointments ?? []).map((appt) => {
              const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
              const profile = patient
                ? Array.isArray(patient.profiles)
                  ? patient.profiles[0]
                  : patient.profiles
                : null;
              return (
                <TableRow key={appt.id}>
                  <TableCell>{profile?.full_name ?? "Unknown"}</TableCell>
                  <TableCell>{new Date(appt.appointment_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusChip status={appt.status} />
                  </TableCell>
                  <TableCell align="right">
                    {appt.status === "scheduled" && (
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        <form action={updateAppointmentStatus.bind(null, appt.id, "completed")}>
                          <Button type="submit" size="small">
                            Mark completed
                          </Button>
                        </form>
                        <form action={updateAppointmentStatus.bind(null, appt.id, "cancelled")}>
                          <Button type="submit" size="small" color="error">
                            Cancel
                          </Button>
                        </form>
                      </Stack>
                    )}
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
