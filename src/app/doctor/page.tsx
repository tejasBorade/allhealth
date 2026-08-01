import Typography from "@mui/material/Typography";
import { requireRole } from "@/lib/auth/requireRole";

export default async function DoctorDashboard() {
  const { profile } = await requireRole(["doctor"]);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Welcome{profile.full_name ? `, Dr. ${profile.full_name}` : ""}
      </Typography>
      <Typography color="text.secondary">
        Use the sidebar to see your patients, write prescriptions and medical
        records, and manage appointments.
      </Typography>
    </>
  );
}
