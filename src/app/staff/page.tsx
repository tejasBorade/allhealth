import Typography from "@mui/material/Typography";
import { requireRole } from "@/lib/auth/requireRole";

export default async function StaffDashboard() {
  const { profile } = await requireRole(["staff"]);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
      </Typography>
      <Typography color="text.secondary">
        Use the sidebar to manage patient billing and upload medical reports.
      </Typography>
    </>
  );
}
