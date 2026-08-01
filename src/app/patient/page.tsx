import Typography from "@mui/material/Typography";
import { requireRole } from "@/lib/auth/requireRole";

export default async function PatientDashboard() {
  const { profile } = await requireRole(["patient"]);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
      </Typography>
      <Typography color="text.secondary">
        Use the sidebar to find a doctor, book an appointment, or check your
        prescriptions, medical records, and billing. Alerts/reminders are
        still on the roadmap (Phase 2).
      </Typography>
    </>
  );
}
