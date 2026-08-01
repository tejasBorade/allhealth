import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import AddRecordForm from "./AddRecordForm";
import NewPrescriptionForm from "./NewPrescriptionForm";

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  await requireRole(["doctor"]);
  const { patientId } = await params;

  const supabase = await createClient();
  const [{ data: profile }, { data: records }, { data: prescriptions }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", patientId).single(),
    supabase
      .from("medical_records")
      .select("id, record_type, notes, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select(
        "id, prescribed_at, follow_up_date, notes, prescription_medicines(id, medication_name, dosage, frequency_code, duration_days)"
      )
      .eq("patient_id", patientId)
      .order("prescribed_at", { ascending: false }),
  ]);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        {profile?.full_name ?? "Patient"}
      </Typography>
      {profile?.phone && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {profile.phone}
        </Typography>
      )}

      <NewPrescriptionForm patientId={patientId} />
      <AddRecordForm patientId={patientId} />

      <Typography variant="h6" gutterBottom>
        Prescriptions
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {(prescriptions ?? []).length === 0 && (
          <Typography color="text.secondary">None yet.</Typography>
        )}
        {(prescriptions ?? []).map((rx) => (
          <Card key={rx.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2">
                {new Date(rx.prescribed_at).toLocaleDateString()}
                {rx.follow_up_date &&
                  ` — follow-up ${new Date(rx.follow_up_date).toLocaleDateString()}`}
              </Typography>
              {rx.notes && <Typography variant="body2">{rx.notes}</Typography>}
              <Divider sx={{ my: 1 }} />
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
          </Card>
        ))}
      </Stack>

      <Typography variant="h6" gutterBottom>
        Medical records
      </Typography>
      <Stack spacing={2}>
        {(records ?? []).length === 0 && (
          <Typography color="text.secondary">None yet.</Typography>
        )}
        {(records ?? []).map((record) => (
          <Card key={record.id} variant="outlined">
            <CardContent>
              <Chip label={record.record_type} size="small" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {new Date(record.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {record.notes}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );
}
