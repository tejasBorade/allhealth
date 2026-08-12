import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/EmptyState";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";
import { todayInZone } from "@/lib/reminders/timezone";
import { scheduledDosesInRange } from "@/lib/medication/doseSchedule";
import { markDoseTaken } from "./actions";

interface TodayDose {
  medicineId: string;
  medicationName: string;
  dosage: string;
  scheduledFor: Date;
  taken: boolean;
}

export default async function PatientDashboard() {
  const { user, profile } = await requireRole(["patient"]);

  const supabase = await createClient();
  const now = new Date();
  const today = todayInZone(now, REMINDER_TIMEZONE);

  const [
    { count: upcomingCount },
    { count: prescriptionsCount },
    { count: pendingBillsCount },
    { data: activeMedicines },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", user.id)
      .eq("status", "scheduled")
      .gte("appointment_at", now.toISOString()),
    supabase
      .from("prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", user.id),
    supabase
      .from("billing")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("prescription_medicines")
      .select("id, medication_name, dosage, frequency_code, duration_days, start_date, prescriptions!inner(patient_id)")
      .eq("prescriptions.patient_id", user.id)
      .lte("start_date", today),
  ]);

  const todayDoses: TodayDose[] = (activeMedicines ?? []).flatMap((medicine) =>
    scheduledDosesInRange(medicine, today, today).map((scheduledFor) => ({
      medicineId: medicine.id,
      medicationName: medicine.medication_name,
      dosage: medicine.dosage,
      scheduledFor,
      taken: false,
    }))
  );
  todayDoses.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  if (todayDoses.length > 0) {
    const { data: takenToday } = await supabase
      .from("dose_logs")
      .select("prescription_medicine_id, scheduled_for")
      .eq("patient_id", user.id)
      .gte("scheduled_for", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    const takenSet = new Set(
      (takenToday ?? []).map((log) => `${log.prescription_medicine_id}|${new Date(log.scheduled_for).getTime()}`)
    );
    for (const dose of todayDoses) {
      dose.taken = takenSet.has(`${dose.medicineId}|${dose.scheduledFor.getTime()}`);
    }
  }

  const takenCount = todayDoses.filter((d) => d.taken).length;

  return (
    <>
      <PageHeader
        title={`Welcome${profile.full_name ? `, ${profile.full_name}` : ""}`}
        subtitle="Use the sidebar to find a doctor, book an appointment, or check your prescriptions, medical records, and billing."
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Upcoming appointments"
            value={upcomingCount ?? 0}
            icon={EventRoundedIcon}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Active prescriptions"
            value={prescriptionsCount ?? 0}
            icon={MedicationRoundedIcon}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Pending bills"
            value={pendingBillsCount ?? 0}
            icon={ReceiptLongRoundedIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1">💊 Today&apos;s Medicines</Typography>
          {todayDoses.length > 0 && (
            <Chip
              label={`${takenCount}/${todayDoses.length} taken`}
              size="small"
              color={takenCount === todayDoses.length ? "success" : "default"}
            />
          )}
        </Box>
        <CardContent sx={{ pt: 0 }}>
          {todayDoses.length === 0 && (
            <EmptyState
              icon={MedicationRoundedIcon}
              title="No doses scheduled today"
              description="Active prescriptions with a dosing schedule will show up here."
            />
          )}
          {todayDoses.map((dose, index) => (
            <Box
              key={`${dose.medicineId}-${dose.scheduledFor.toISOString()}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                borderTop: index === 0 ? "none" : "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", width: 72, flexShrink: 0, color: "text.secondary" }}
              >
                {dose.scheduledFor.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: REMINDER_TIMEZONE,
                })}
              </Typography>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {dose.medicationName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dose.dosage}
                </Typography>
              </Box>
              {dose.taken ? (
                <Chip
                  icon={<CheckCircleRoundedIcon />}
                  label="Taken"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <form action={markDoseTaken.bind(null, dose.medicineId, dose.scheduledFor.toISOString())}>
                  <Button type="submit" size="small" variant="outlined">
                    Mark as taken
                  </Button>
                </form>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
