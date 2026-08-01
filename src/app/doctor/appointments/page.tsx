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
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Your appointments
      </Typography>

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
                <TableCell colSpan={4} align="center">
                  No appointments yet.
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
                    <Chip
                      label={appt.status}
                      size="small"
                      color={
                        appt.status === "cancelled"
                          ? "default"
                          : appt.status === "completed"
                            ? "success"
                            : "primary"
                      }
                    />
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
