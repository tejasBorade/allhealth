import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import AddRecordForm from "./AddRecordForm";
import NewPrescriptionForm from "./NewPrescriptionForm";
import { updateReportStatus } from "./actions";

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  await requireRole(["doctor"]);
  const { patientId } = await params;

  const supabase = await createClient();
  const [{ data: profile }, { data: patient }, { data: records }, { data: prescriptions }, { data: reports }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", patientId).single(),
      supabase
        .from("patients")
        .select("allergies, blood_group, chronic_conditions, abha_number")
        .eq("profile_id", patientId)
        .single(),
      supabase
        .from("medical_records")
        .select("id, record_type, notes, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("prescriptions")
        .select(
          "id, prescribed_at, follow_up_date, diagnosis, notes, prescription_medicines(id, medication_name, dosage, frequency_code, duration_days)"
        )
        .eq("patient_id", patientId)
        .order("prescribed_at", { ascending: false }),
      supabase
        .from("medical_reports")
        .select("id, report_type, status, uploaded_at")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false }),
    ]);

  return (
    <>
      <PageHeader title={profile?.full_name ?? "Patient"} subtitle={profile?.phone ?? undefined} />

      {(patient?.blood_group || patient?.abha_number || patient?.chronic_conditions) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 2 }}>
          {patient?.blood_group && (
            <Chip size="small" color="info" variant="outlined" label={`Blood group: ${patient.blood_group}`} />
          )}
          {patient?.abha_number && (
            <Chip size="small" variant="outlined" label={`ABHA: ${patient.abha_number}`} />
          )}
          {patient?.chronic_conditions && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`Chronic conditions: ${patient.chronic_conditions}`}
            />
          )}
        </Stack>
      )}

      {patient?.allergies && patient.allergies.trim() !== "" && (
        <Alert severity="warning" sx={{ mb: 3, fontWeight: 600 }}>
          ⚠ Known allergy: {patient.allergies} — verify before prescribing.
        </Alert>
      )}

      <NewPrescriptionForm patientId={patientId} />
      <AddRecordForm patientId={patientId} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Prescriptions
      </Typography>
      {(prescriptions ?? []).length === 0 ? (
        <Paper variant="outlined" sx={{ mb: 4 }}>
          <EmptyState icon={MedicationOutlinedIcon} title="No prescriptions yet" />
        </Paper>
      ) : (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {(prescriptions ?? []).map((rx) => (
            <Card key={rx.id} variant="outlined">
              <CardContent>
                {rx.diagnosis && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {rx.diagnosis}
                  </Typography>
                )}
                <Typography variant="subtitle2">
                  {new Date(rx.prescribed_at).toLocaleDateString()}
                  {rx.follow_up_date &&
                    ` — follow-up ${new Date(rx.follow_up_date).toLocaleDateString()}`}
                </Typography>
                {rx.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Medical records
      </Typography>
      {(records ?? []).length === 0 ? (
        <Paper variant="outlined" sx={{ mb: 4 }}>
          <EmptyState icon={DescriptionOutlinedIcon} title="No medical records yet" />
        </Paper>
      ) : (
        <Stack spacing={2} sx={{ mb: 4 }}>
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
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Lab reports
      </Typography>
      {(reports ?? []).length === 0 ? (
        <Paper variant="outlined">
          <EmptyState icon={ScienceOutlinedIcon} title="No lab reports uploaded yet" />
        </Paper>
      ) : (
        <Stack spacing={2}>
          {(reports ?? []).map((report) => (
            <Card key={report.id} variant="outlined">
              <CardContent
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Chip label={report.report_type} size="small" />
                    <StatusChip status={report.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded {new Date(report.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  {report.status !== "reviewed" && (
                    <form action={updateReportStatus.bind(null, report.id, patientId, "reviewed")}>
                      <Button type="submit" size="small" variant="outlined">
                        Mark reviewed
                      </Button>
                    </form>
                  )}
                  {report.status !== "critical" && (
                    <form action={updateReportStatus.bind(null, report.id, patientId, "critical")}>
                      <Button type="submit" size="small" color="error" variant="outlined">
                        Flag critical
                      </Button>
                    </form>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
