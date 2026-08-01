import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function PatientPrescriptionsPage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select(
      "id, prescribed_at, follow_up_date, notes, doctors(profiles(full_name)), prescription_medicines(id, medication_name, dosage, frequency_code, duration_days, start_date)"
    )
    .eq("patient_id", user.id)
    .order("prescribed_at", { ascending: false });

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Your prescriptions
      </Typography>

      {error && <Typography color="error">{error.message}</Typography>}

      <Stack spacing={2}>
        {(prescriptions ?? []).length === 0 && (
          <Typography color="text.secondary">No prescriptions yet.</Typography>
        )}
        {(prescriptions ?? []).map((rx) => {
          const doctor = Array.isArray(rx.doctors) ? rx.doctors[0] : rx.doctors;
          const profile = doctor
            ? Array.isArray(doctor.profiles)
              ? doctor.profiles[0]
              : doctor.profiles
            : null;
          return (
            <Card key={rx.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">
                  Dr. {profile?.full_name ?? "Unknown"} —{" "}
                  {new Date(rx.prescribed_at).toLocaleDateString()}
                </Typography>
                {rx.follow_up_date && (
                  <Typography variant="body2" color="text.secondary">
                    Follow-up: {new Date(rx.follow_up_date).toLocaleDateString()}
                  </Typography>
                )}
                {rx.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {rx.notes}
                  </Typography>
                )}
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {rx.prescription_medicines.map((med) => (
                    <Chip
                      key={med.id}
                      label={`${med.medication_name} — ${med.dosage} (${med.frequency_code}, ${med.duration_days}d)`}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
