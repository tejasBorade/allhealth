import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PatientListRow from "./PatientListRow";

export default async function DoctorPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await requireRole(["doctor"]);
  const { q } = await searchParams;
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

  const { data: patients, error } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, phone").in("id", patientIds)
      : { data: [], error: null };

  const filteredPatients = q
    ? (patients ?? []).filter((patient) =>
        (patient.full_name ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : (patients ?? []);

  return (
    <>
      <PageHeader title="Your patients" subtitle="Everyone you've appointed or prescribed to." />

      <Box component="form" sx={{ mb: 3 }}>
        <TextField
          name="q"
          label="Search patients"
          defaultValue={q ?? ""}
          sx={{ width: { xs: "100%", sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined">
        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={PeopleAltOutlinedIcon}
            title={q ? "No matching patients" : "No patients yet"}
            description={
              q
                ? "Try a different name or clear your search to see everyone."
                : "Patients you appoint or prescribe to will show up here."
            }
          />
        ) : (
          <List>
            {filteredPatients.map((patient) => (
              <PatientListRow key={patient.id} patient={patient} />
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}
