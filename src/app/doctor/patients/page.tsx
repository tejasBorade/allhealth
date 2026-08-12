import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
      <PageHeader title="Your patients" subtitle="Everyone you've appointed or prescribed to." />

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined">
        {(patients ?? []).length === 0 ? (
          <EmptyState
            icon={PeopleAltOutlinedIcon}
            title="No patients yet"
            description="Patients you appoint or prescribe to will show up here."
          />
        ) : (
          <List>
            {(patients ?? []).map((patient) => (
              <ListItemButton
                key={patient.id}
                component="a"
                href={`/doctor/patients/${patient.id}`}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>{initials(patient.full_name)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={patient.full_name ?? "Unnamed patient"}
                  secondary={patient.phone ?? undefined}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}
