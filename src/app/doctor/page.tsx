import Link from "next/link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { theme } from "@/lib/theme";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/EmptyState";
import LinkButton from "@/components/LinkButton";
import { REMINDER_TIMEZONE } from "@/lib/reminders/constants";
import { todayInZone, addDaysToDateStr, zonedTimeToUtc } from "@/lib/reminders/timezone";
import { scheduledDosesInRange, type PrescriptionMedicineSchedule } from "@/lib/medication/doseSchedule";
import AppointmentRow from "./AppointmentRow";

const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function adherenceColor(pct: number): "success" | "warning" | "error" {
  if (pct >= 90) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function relativeTime(date: Date, now: Date): string {
  const mins = Math.round((now.getTime() - date.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface Alert {
  icon: SvgIconComponent;
  color: "error" | "warning";
  title: string;
  sub: string;
}

interface ActivityItem {
  icon: SvgIconComponent;
  color: string;
  title: string;
  sub: string;
  at: Date;
}

interface PriorityPatient {
  patientId: string;
  name: string;
  reason: "overdue" | "critical";
}

type ConditionCategory = "Diabetes" | "Cardiovascular" | "Respiratory" | "Renal" | "Endocrine & Other";

// Buckets a single (comma-split) chronic-condition entry by keyword match. A
// piece can land in more than one bucket, and anything unmatched falls back
// to the catch-all "Endocrine & Other" bucket.
function categorizeCondition(piece: string): ConditionCategory[] {
  const text = piece.toLowerCase();
  const categories: ConditionCategory[] = [];
  if (text.includes("diabet")) categories.push("Diabetes");
  if (["hypertension", "cardiac", "coronary", "heart"].some((k) => text.includes(k))) categories.push("Cardiovascular");
  if (["asthma", "copd", "respiratory"].some((k) => text.includes(k))) categories.push("Respiratory");
  if (["renal", "kidney"].some((k) => text.includes(k))) categories.push("Renal");
  if (["thyroid", "hormone"].some((k) => text.includes(k))) categories.push("Endocrine & Other");
  if (categories.length === 0) categories.push("Endocrine & Other");
  return categories;
}

export default async function DoctorDashboard() {
  const { user, profile } = await requireRole(["doctor"]);
  const supabase = await createClient();

  const now = new Date();
  const today = todayInZone(now, REMINDER_TIMEZONE);
  const windowStart = addDaysToDateStr(today, -29); // 30-day adherence window
  const chartStart = addDaysToDateStr(today, -6); // 7-day chart window
  const todayStartUtc = zonedTimeToUtc(today, "00:00", REMINDER_TIMEZONE);
  const tomorrowStartUtc = zonedTimeToUtc(addDaysToDateStr(today, 1), "00:00", REMINDER_TIMEZONE);

  const [
    { data: fromAppointments },
    { data: fromPrescriptions },
    { count: prescriptionsToday },
    { data: doctorMedicinesRaw },
    { data: appointmentsToday },
  ] = await Promise.all([
    supabase.from("appointments").select("patient_id").eq("doctor_id", user.id),
    supabase.from("prescriptions").select("patient_id").eq("doctor_id", user.id),
    supabase
      .from("prescriptions")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .gte("prescribed_at", todayStartUtc.toISOString())
      .lt("prescribed_at", tomorrowStartUtc.toISOString()),
    supabase
      .from("prescription_medicines")
      .select(
        "id, medication_name, dosage, frequency_code, duration_days, start_date, prescriptions!inner(doctor_id, patient_id, follow_up_date)"
      )
      .eq("prescriptions.doctor_id", user.id)
      .lte("start_date", today),
    supabase
      .from("appointments")
      .select("id, patient_id, appointment_at, status, patients(profiles(full_name))")
      .eq("doctor_id", user.id)
      .gte("appointment_at", todayStartUtc.toISOString())
      .lt("appointment_at", tomorrowStartUtc.toISOString())
      .order("appointment_at", { ascending: true }),
  ]);

  const patientIds = Array.from(
    new Set([
      ...(fromAppointments ?? []).map((row) => row.patient_id),
      ...(fromPrescriptions ?? []).map((row) => row.patient_id),
    ])
  );

  const medicines = (doctorMedicinesRaw ?? []) as (PrescriptionMedicineSchedule & {
    medication_name: string;
    prescriptions: { doctor_id: string; patient_id: string; follow_up_date: string | null };
  })[];
  const medicineIds = medicines.map((m) => m.id);

  // Expected doses per medicine within the 30-day adherence window, also
  // bucketed by local day (for the 7-day chart, a subset of the same window).
  const expectedByMedicine = new Map<string, number>();
  const expectedByDay = new Map<string, number>();
  let expectedTotal = 0;
  for (const medicine of medicines) {
    const doses = scheduledDosesInRange(medicine, windowStart, today).filter((d) => d.getTime() <= now.getTime());
    expectedByMedicine.set(medicine.id, doses.length);
    expectedTotal += doses.length;
    for (const dose of doses) {
      const day = todayInZone(dose, REMINDER_TIMEZONE);
      if (day >= chartStart) expectedByDay.set(day, (expectedByDay.get(day) ?? 0) + 1);
    }
  }

  const { data: doseLogs } =
    medicineIds.length > 0
      ? await supabase
          .from("dose_logs")
          .select("prescription_medicine_id, scheduled_for")
          .in("prescription_medicine_id", medicineIds)
          .gte("scheduled_for", zonedTimeToUtc(windowStart, "00:00", REMINDER_TIMEZONE).toISOString())
          .lte("scheduled_for", now.toISOString())
      : { data: [] as { prescription_medicine_id: string; scheduled_for: string }[] };

  const takenByMedicine = new Map<string, number>();
  const takenByDay = new Map<string, number>();
  let takenTotal = 0;
  for (const log of doseLogs ?? []) {
    takenByMedicine.set(log.prescription_medicine_id, (takenByMedicine.get(log.prescription_medicine_id) ?? 0) + 1);
    takenTotal += 1;
    const day = todayInZone(new Date(log.scheduled_for), REMINDER_TIMEZONE);
    if (day >= chartStart) takenByDay.set(day, (takenByDay.get(day) ?? 0) + 1);
  }

  const avgAdherencePct = expectedTotal > 0 ? Math.round((takenTotal / expectedTotal) * 100) : null;

  const weekChart = Array.from({ length: 7 }, (_, i) => {
    const day = addDaysToDateStr(chartStart, i);
    const expected = expectedByDay.get(day) ?? 0;
    const taken = takenByDay.get(day) ?? 0;
    const pct = expected > 0 ? Math.round((taken / expected) * 100) : null;
    const weekday = WEEKDAY_LABEL[new Date(`${day}T00:00:00Z`).getUTCDay()];
    return { day, weekday, pct };
  });

  const medicineAdherence = Array.from(
    medicines
      .reduce((map, medicine) => {
        const expected = expectedByMedicine.get(medicine.id) ?? 0;
        const taken = takenByMedicine.get(medicine.id) ?? 0;
        const existing = map.get(medicine.medication_name) ?? { expected: 0, taken: 0 };
        map.set(medicine.medication_name, { expected: existing.expected + expected, taken: existing.taken + taken });
        return map;
      }, new Map<string, { expected: number; taken: number }>())
      .entries()
  )
    .map(([name, { expected, taken }]) => ({ name, pct: expected > 0 ? Math.round((taken / expected) * 100) : null }))
    .filter((m): m is { name: string; pct: number } => m.pct !== null)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const [{ data: reports }, { data: followUpRows }, { data: conditionRows }] = await Promise.all([
    patientIds.length > 0
      ? supabase
          .from("medical_reports")
          .select("id, report_type, status, uploaded_at, patient_id, patients(profiles(full_name))")
          .in("patient_id", patientIds)
          .in("status", ["pending", "critical"])
          .order("uploaded_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("prescriptions")
      .select("patient_id, follow_up_date, patients(profiles(full_name))")
      .eq("doctor_id", user.id)
      .lte("follow_up_date", today)
      .order("follow_up_date", { ascending: true }),
    patientIds.length > 0
      ? supabase.from("patients").select("chronic_conditions").in("profile_id", patientIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const pendingReportsCount = (reports ?? []).length;
  const criticalReportsCount = (reports ?? []).filter((r) => r.status === "critical").length;

  // Priority follow-ups: patients overdue for a follow-up (or due today), or
  // with a critical lab report — deduped by patient, critical takes priority.
  const priorityMap = new Map<string, PriorityPatient>();
  for (const report of (reports ?? []).filter((r) => r.status === "critical")) {
    priorityMap.set(report.patient_id, { patientId: report.patient_id, name: nameOf(report), reason: "critical" });
  }
  for (const rx of followUpRows ?? []) {
    if (priorityMap.has(rx.patient_id)) continue;
    priorityMap.set(rx.patient_id, { patientId: rx.patient_id, name: nameOf(rx), reason: "overdue" });
  }
  const priorityPatients = Array.from(priorityMap.values()).slice(0, 5);

  // Conditions overview: bucket each patient's comma-separated chronic
  // conditions into categories, counting a patient at most once per bucket.
  const conditionCounts = new Map<ConditionCategory, number>();
  for (const row of conditionRows ?? []) {
    if (!row.chronic_conditions) continue;
    const patientCategories = new Set<ConditionCategory>();
    for (const piece of row.chronic_conditions.split(",").map((p) => p.trim()).filter(Boolean)) {
      for (const category of categorizeCondition(piece)) patientCategories.add(category);
    }
    for (const category of patientCategories) {
      conditionCounts.set(category, (conditionCounts.get(category) ?? 0) + 1);
    }
  }
  const conditionData = Array.from(conditionCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const maxConditionCount = conditionData[0]?.count ?? 0;

  const recentStart = addDaysToDateStr(today, -1);
  const alerts: Alert[] = [];

  for (const report of (reports ?? []).filter((r) => r.status === "critical").slice(0, 3)) {
    const p = Array.isArray(report.patients) ? report.patients[0] : report.patients;
    const prof = p ? (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) : null;
    alerts.push({
      icon: ScienceRoundedIcon,
      color: "error",
      title: `${report.report_type} flagged critical`,
      sub: `${prof?.full_name ?? "Unknown patient"} · ${relativeTime(new Date(report.uploaded_at), now)}`,
    });
  }

  const seenFollowUpPatients = new Set<string>();
  for (const rx of medicines.map((m) => m.prescriptions)) {
    if (!rx.follow_up_date || rx.follow_up_date >= today) continue;
    if (seenFollowUpPatients.has(rx.patient_id)) continue;
    seenFollowUpPatients.add(rx.patient_id);
    alerts.push({
      icon: EventAvailableRoundedIcon,
      color: "warning",
      title: "Follow-up overdue",
      sub: `Was due ${new Date(rx.follow_up_date).toLocaleDateString()}`,
    });
    if (seenFollowUpPatients.size >= 2) break;
  }

  for (const medicine of medicines) {
    if (alerts.length >= 5) break;
    const recentDoses = scheduledDosesInRange(medicine, recentStart, today).filter((d) => d.getTime() <= now.getTime());
    if (recentDoses.length > 0 && (takenByMedicine.get(medicine.id) ?? 0) === 0) {
      alerts.push({
        icon: MedicationRoundedIcon,
        color: "error",
        title: `No confirmed doses — ${medicine.medication_name}`,
        sub: "Nothing marked taken in the last 2 days",
      });
    }
  }

  const [{ data: recentRx }, { data: recentRecords }, { data: recentReports }] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, prescribed_at, patients(profiles(full_name))")
      .eq("doctor_id", user.id)
      .order("prescribed_at", { ascending: false })
      .limit(3),
    supabase
      .from("medical_records")
      .select("id, created_at, record_type, patients(profiles(full_name))")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    patientIds.length > 0
      ? supabase
          .from("medical_reports")
          .select("id, uploaded_at, report_type, patients(profiles(full_name))")
          .in("patient_id", patientIds)
          .order("uploaded_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  function nameOf(row: { patients: unknown }): string {
    const p = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    const withProfiles = p as { profiles: { full_name: string | null } | { full_name: string | null }[] } | null;
    const prof = withProfiles
      ? Array.isArray(withProfiles.profiles)
        ? withProfiles.profiles[0]
        : withProfiles.profiles
      : null;
    return prof?.full_name ?? "Unknown patient";
  }

  const activity: ActivityItem[] = [
    ...(recentRx ?? []).map((rx) => ({
      icon: MedicationRoundedIcon,
      color: theme.palette.secondary.main,
      title: "Prescription written",
      sub: nameOf(rx),
      at: new Date(rx.prescribed_at),
    })),
    ...(recentRecords ?? []).map((r) => ({
      icon: DescriptionRoundedIcon,
      color: theme.palette.info.main,
      title: `${r.record_type} added`,
      sub: nameOf(r),
      at: new Date(r.created_at),
    })),
    ...(recentReports ?? []).map((r) => ({
      icon: UploadFileRoundedIcon,
      color: theme.palette.warning.main,
      title: `${r.report_type} uploaded`,
      sub: nameOf(r),
      at: new Date(r.uploaded_at),
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title={`Welcome, Dr. ${profile.full_name ?? ""}`}
        subtitle="Use the sidebar to see your patients, write prescriptions and medical records, and manage appointments."
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/doctor/patients" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard label="Total patients" value={patientIds.length} icon={PeopleAltRoundedIcon} color="primary" />
          </Link>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Avg. adherence (30d)"
            value={avgAdherencePct !== null ? `${avgAdherencePct}%` : "No data"}
            icon={TrendingUpRoundedIcon}
            color={avgAdherencePct !== null ? adherenceColor(avgAdherencePct) : "secondary"}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/doctor/reports" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              label="Pending lab reports"
              value={pendingReportsCount}
              icon={ScienceRoundedIcon}
              color={criticalReportsCount > 0 ? "error" : "warning"}
            />
          </Link>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Link href="/doctor/prescriptions" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard label="Prescriptions today" value={prescriptionsToday ?? 0} icon={BoltRoundedIcon} color="secondary" />
          </Link>
        </Grid>
      </Grid>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" }, gap: 2.5, alignItems: "start" }}>
        {/* LEFT COLUMN */}
        <Stack spacing={2.5}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              📈 Weekly Adherence
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: "20px", height: 140, px: 1 }}>
              {weekChart.map((d) => (
                <Box key={d.day} sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 60 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: d.pct !== null ? "text.primary" : "text.disabled" }}
                  >
                    {d.pct !== null ? `${d.pct}%` : "–"}
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      mt: 0.5,
                      borderRadius: "6px",
                      height: `${d.pct !== null ? Math.max((d.pct / 100) * 90, 4) : 4}px`,
                      bgcolor:
                        d.pct !== null
                          ? alpha(theme.palette[adherenceColor(d.pct)].main, 0.85)
                          : theme.palette.grey[200],
                      transition: "height 0.3s ease",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                    {d.weekday}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>

          <Card>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1">📅 Today&apos;s Appointments</Typography>
              <LinkButton href="/doctor/appointments" size="small">
                View all →
              </LinkButton>
            </Box>
            <Box sx={{ px: 2.5, pb: 2 }}>
              {(appointmentsToday ?? []).length === 0 && (
                <EmptyState icon={EventAvailableRoundedIcon} title="No appointments today" />
              )}
              {(appointmentsToday ?? []).slice(0, 4).map((appt) => {
                const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
                const prof = patient ? (Array.isArray(patient.profiles) ? patient.profiles[0] : patient.profiles) : null;
                const name = prof?.full_name ?? "Unknown patient";
                return (
                  <AppointmentRow
                    key={appt.id}
                    patientId={appt.patient_id}
                    patientName={name}
                    time={new Date(appt.appointment_at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: REMINDER_TIMEZONE,
                    })}
                    status={appt.status}
                  />
                );
              })}
              {(appointmentsToday ?? []).length > 4 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", pt: 1.5 }}>
                  + {(appointmentsToday ?? []).length - 4} more today
                </Typography>
              )}
            </Box>
          </Card>

          <Card>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1">⏰ Today&apos;s Priority Follow-ups</Typography>
            </Box>
            <Box sx={{ px: 2.5, pb: 2 }}>
              {priorityPatients.length === 0 && (
                <EmptyState icon={TaskAltRoundedIcon} title="Nothing urgent today" />
              )}
              {priorityPatients.map((p, i) => (
                <Stack
                  key={p.patientId}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", py: 1.25, borderTop: i === 0 ? "none" : "1px solid", borderColor: "divider" }}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, fontSize: 13, bgcolor: alpha(theme.palette.primary.main, 0.14), color: "primary.main" }}
                  >
                    {p.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
                    {p.name}
                  </Typography>
                  <Chip
                    label={p.reason === "critical" ? "Critical report needs review" : "Follow-up overdue"}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette[p.reason === "critical" ? "error" : "warning"].main, 0.14),
                      color: theme.palette[p.reason === "critical" ? "error" : "warning"].dark,
                    }}
                  />
                </Stack>
              ))}
            </Box>
          </Card>
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack spacing={2.5}>
          <Card>
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: alpha(theme.palette.error.main, 0.06),
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "error.main" }}>
                🚨 Critical Alerts
              </Typography>
              {alerts.length > 0 && <Chip label={alerts.length} size="small" color="error" />}
            </Box>
            <Box sx={{ px: 2.5, py: alerts.length === 0 ? 0 : 1.5 }}>
              {alerts.length === 0 && (
                <EmptyState
                  icon={ReportProblemRoundedIcon}
                  title="Nothing urgent"
                  description="Critical reports and overdue follow-ups will show up here."
                />
              )}
              {alerts.map((alert, i) => {
                const Icon = alert.icon;
                return (
                  <Stack
                    key={i}
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "flex-start", py: 1.1, borderTop: i === 0 ? "none" : "1px solid", borderColor: "divider" }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette[alert.color].main, 0.12),
                        color: theme.palette[alert.color].main,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {alert.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.sub}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              📊 Adherence by Medicine
            </Typography>
            {medicineAdherence.length === 0 ? (
              <EmptyState icon={MedicationRoundedIcon} title="No data yet" description="Shows once patients start confirming doses." />
            ) : (
              medicineAdherence.map((m) => (
                <Stack key={m.name} direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="caption" sx={{ width: 110, flexShrink: 0 }} noWrap>
                    {m.name}
                  </Typography>
                  <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: "divider", overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${m.pct}%`,
                        height: "100%",
                        borderRadius: 4,
                        bgcolor: theme.palette[adherenceColor(m.pct)].main,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, width: 34, textAlign: "right" }}>
                    {m.pct}%
                  </Typography>
                </Stack>
              ))
            )}
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              🩺 Conditions Overview
            </Typography>
            {conditionData.length === 0 ? (
              <EmptyState
                icon={MonitorHeartRoundedIcon}
                title="No conditions on record"
                description="Shows once patients have chronic conditions recorded."
              />
            ) : (
              conditionData.map((c) => (
                <Stack key={c.category} direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="caption" sx={{ width: 128, flexShrink: 0 }} noWrap>
                    {c.category}
                  </Typography>
                  <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: "divider", overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${(c.count / maxConditionCount) * 100}%`,
                        height: "100%",
                        borderRadius: 4,
                        bgcolor: theme.palette.primary.main,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, width: 74, textAlign: "right", flexShrink: 0 }}>
                    {c.count} {c.count === 1 ? "patient" : "patients"}
                  </Typography>
                </Stack>
              ))
            )}
          </Card>

          <Card>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1">⚡ Recent Activity</Typography>
            </Box>
            <Box sx={{ px: 2.5, pb: 2 }}>
              {activity.length === 0 && <EmptyState title="No recent activity" />}
              {activity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Stack
                    key={i}
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "flex-start", py: 1.1, borderTop: i === 0 ? "none" : "1px solid", borderColor: "divider" }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(item.color, 0.14),
                        color: item.color,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.sub} · {relativeTime(item.at, now)}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          </Card>
        </Stack>
      </Box>
    </>
  );
}
