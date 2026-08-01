import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["doctor"]);

  return (
    <AppShell
      title="Doctor"
      navItems={[
        { label: "Dashboard", href: "/doctor", icon: DashboardIcon },
        { label: "My Patients", href: "/doctor/patients", icon: PeopleIcon },
        { label: "Appointments", href: "/doctor/appointments", icon: EventIcon },
      ]}
    >
      {children}
    </AppShell>
  );
}
