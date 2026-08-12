import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import CancelAppointmentButton from "./CancelAppointmentButton";

export default async function PatientAppointmentsPage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, appointment_at, status, notes, doctors(profiles(full_name))")
    .eq("patient_id", user.id)
    .order("appointment_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="Your appointments"
        subtitle="Track upcoming visits and review your appointment history."
      />

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Doctor</TableCell>
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
                    icon={EventBusyRoundedIcon}
                    title="No appointments yet"
                    description="Book a visit with a doctor to see it listed here."
                  />
                </TableCell>
              </TableRow>
            )}
            {(appointments ?? []).map((appt) => {
              const doctor = Array.isArray(appt.doctors) ? appt.doctors[0] : appt.doctors;
              const profile = doctor
                ? Array.isArray(doctor.profiles)
                  ? doctor.profiles[0]
                  : doctor.profiles
                : null;
              return (
                <TableRow key={appt.id}>
                  <TableCell>Dr. {profile?.full_name ?? "Unknown"}</TableCell>
                  <TableCell>{new Date(appt.appointment_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusChip status={appt.status} />
                  </TableCell>
                  <TableCell align="right">
                    {appt.status === "scheduled" && (
                      <CancelAppointmentButton appointmentId={appt.id} />
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
