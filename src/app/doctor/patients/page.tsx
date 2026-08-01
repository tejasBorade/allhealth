import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function DoctorPatientsPage() {
  const { user } = await requireRole(["doctor"]);
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

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Your patients
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Everyone you&apos;ve appointed or prescribed to.
      </Typography>

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined">
        <List>
          {(patients ?? []).length === 0 && (
            <ListItemButton disabled>
              <ListItemText primary="No patients yet." />
            </ListItemButton>
          )}
          {(patients ?? []).map((patient) => (
            <ListItemButton
              key={patient.id}
              component="a"
              href={`/doctor/patients/${patient.id}`}
            >
              <ListItemText
                primary={patient.full_name ?? "Unnamed patient"}
                secondary={patient.phone ?? undefined}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </>
  );
}
