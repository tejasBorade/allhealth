import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export default async function PatientPrescriptionsPage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select(
      "id, prescribed_at, follow_up_date, diagnosis, notes, doctors(profiles(full_name)), prescription_medicines(id, medication_name, dosage, frequency_code, duration_days, start_date)"
    )
    .eq("patient_id", user.id)
    .order("prescribed_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Your prescriptions"
        subtitle="Medications prescribed during your visits, with dosage and frequency."
      />

      {error && <Typography color="error">{error.message}</Typography>}

      <Stack spacing={2}>
        {(prescriptions ?? []).length === 0 && (
          <EmptyState
            icon={MedicationRoundedIcon}
            title="No prescriptions yet"
            description="Medicines your doctor prescribes will appear here."
          />
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
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", mb: rx.notes ? 1 : 0 }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                    }}
                  >
                    <MedicationRoundedIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      Dr. {profile?.full_name ?? "Unknown"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(rx.prescribed_at).toLocaleDateString()}
                      {rx.follow_up_date &&
                        ` · Follow-up ${new Date(rx.follow_up_date).toLocaleDateString()}`}
                    </Typography>
                  </Box>
                </Stack>
                {rx.diagnosis && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1.5 }}>
                    {rx.diagnosis}
                  </Typography>
                )}
                {rx.notes && (
                  <Typography variant="body2" sx={{ mt: 1.5 }}>
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
              <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end" }}>
                <Button
                  component="a"
                  href={`/prescriptions/${rx.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  startIcon={<PrintRoundedIcon fontSize="small" />}
                >
                  Print
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
