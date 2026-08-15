import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";
import { todayInZone, addDaysToDateStr, zonedTimeToUtc } from "@/lib/reminders/timezone";
import AppointmentTableRow from "./AppointmentTableRow";

type RangeKey = "all" | "today" | "tomorrow" | "week";

const RANGE_CHIPS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; range?: string }>;
}) {
  const { user } = await requireRole(["doctor"]);
  const { date, range } = await searchParams;

  const today = todayInZone(new Date(), REMINDER_TIMEZONE);
  const activeRange: RangeKey = date
    ? "all" // a specific date overrides the preset chips — none of them is "active"
    : (["today", "tomorrow", "week"] as const).includes(range as "today" | "tomorrow" | "week")
      ? (range as RangeKey)
      : "all";

  let rangeStart: string | null = null;
  let rangeEnd: string | null = null; // inclusive
  if (date) {
    rangeStart = date;
    rangeEnd = date;
  } else if (activeRange === "today") {
    rangeStart = today;
    rangeEnd = today;
  } else if (activeRange === "tomorrow") {
    rangeStart = addDaysToDateStr(today, 1);
    rangeEnd = rangeStart;
  } else if (activeRange === "week") {
    rangeStart = today;
    rangeEnd = addDaysToDateStr(today, 6);
  }

  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("id, patient_id, appointment_at, status, patients(profiles(full_name))")
    .eq("doctor_id", user.id)
    .order("appointment_at", { ascending: true });

  if (rangeStart && rangeEnd) {
    query = query
      .gte("appointment_at", zonedTimeToUtc(rangeStart, "00:00", REMINDER_TIMEZONE).toISOString())
      .lt("appointment_at", zonedTimeToUtc(addDaysToDateStr(rangeEnd, 1), "00:00", REMINDER_TIMEZONE).toISOString());
  }

  const { data: appointments, error } = await query;

  const subtitle = date
    ? `Showing appointments on ${new Date(`${date}T00:00:00`).toLocaleDateString()}.`
    : activeRange === "today"
      ? "Showing today's appointments."
      : activeRange === "tomorrow"
        ? "Showing tomorrow's appointments."
        : activeRange === "week"
          ? "Showing the next 7 days."
          : "Showing every appointment booked with you.";

  return (
    <>
      <PageHeader title="Your appointments" subtitle={subtitle} />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
        <Stack direction="row" spacing={1}>
          {RANGE_CHIPS.map((c) => (
            <Chip
              key={c.key}
              component="a"
              href={c.key === "all" ? "/doctor/appointments" : `/doctor/appointments?range=${c.key}`}
              clickable
              label={c.label}
              color={!date && activeRange === c.key ? "primary" : "default"}
              variant={!date && activeRange === c.key ? "filled" : "outlined"}
            />
          ))}
        </Stack>

        <Box component="form" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            type="date"
            name="date"
            label="Jump to date"
            defaultValue={date ?? ""}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="outlined" size="small">
            Go
          </Button>
          {date && (
            <Button href="/doctor/appointments" size="small" color="inherit">
              Clear
            </Button>
          )}
        </Box>
      </Box>

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
                    title="No appointments"
                    description={
                      date || activeRange !== "all"
                        ? "No appointments match this filter — try a different date or range."
                        : "Appointments booked with you will show up here."
                    }
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
                <AppointmentTableRow
                  key={appt.id}
                  appointmentId={appt.id}
                  patientId={appt.patient_id}
                  patientName={profile?.full_name ?? "Unknown"}
                  when={new Date(appt.appointment_at).toLocaleString()}
                  status={appt.status}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
