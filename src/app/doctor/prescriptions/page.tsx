import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function DoctorPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await requireRole(["doctor"]);
  const { q } = await searchParams;

  const supabase = await createClient();
  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select(
      "id, prescribed_at, follow_up_date, diagnosis, notes, patient_id, patients(profiles(full_name)), prescription_medicines(id, medication_name, dosage, frequency_code, duration_days)"
    )
    .eq("doctor_id", user.id)
    .order("prescribed_at", { ascending: false });

  const rows = (prescriptions ?? []).map((rx) => {
    const patient = Array.isArray(rx.patients) ? rx.patients[0] : rx.patients;
    const profile = patient
      ? Array.isArray(patient.profiles)
        ? patient.profiles[0]
        : patient.profiles
      : null;
    return { ...rx, patientName: profile?.full_name ?? "Unknown" };
  });

  const filtered = q
    ? rows.filter((rx) => {
        const needle = q.toLowerCase();
        const nameMatch = rx.patientName.toLowerCase().includes(needle);
        const medMatch = rx.prescription_medicines.some((med) =>
          med.medication_name.toLowerCase().includes(needle)
        );
        return nameMatch || medMatch;
      })
    : rows;

  return (
    <>
      <PageHeader
        title="Prescription History"
        subtitle="Every prescription you've written, across all patients."
      />

      <Box component="form" sx={{ mb: 3 }}>
        <TextField
          name="q"
          label="Search by patient or medicine"
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={MedicationRoundedIcon}
          title="No prescriptions found"
          description={
            q
              ? "Try a different search term or clear your search to see everyone."
              : "Prescriptions you write for patients will show up here."
          }
        />
      ) : (
        <Stack spacing={2}>
          {filtered.map((rx) => (
            <Card key={rx.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {rx.patientName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(rx.prescribed_at).toLocaleDateString()}
                  {rx.follow_up_date &&
                    ` — follow-up ${new Date(rx.follow_up_date).toLocaleDateString()}`}
                </Typography>
                {rx.diagnosis && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                    {rx.diagnosis}
                  </Typography>
                )}
                {rx.notes && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {rx.notes}
                  </Typography>
                )}
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {rx.prescription_medicines.map((med) => (
                    <Chip
                      key={med.id}
                      size="small"
                      variant="outlined"
                      label={`${med.medication_name} — ${med.dosage} (${med.frequency_code}, ${med.duration_days}d)`}
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
          ))}
        </Stack>
      )}
    </>
  );
}
