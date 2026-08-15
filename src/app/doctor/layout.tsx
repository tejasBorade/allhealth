import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";
import { PatientDrawerProvider } from "@/components/PatientDrawer/PatientDrawerContext";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["doctor"]);

  return (
    <AppShell
      title="Doctor Dashboard"
      userName={profile.full_name}
      userId={user.id}
      role="doctor"
      navItems={[
        { label: "Dashboard", href: "/doctor", icon: "dashboard" },
        { label: "My Patients", href: "/doctor/patients", icon: "people" },
        { label: "Appointments", href: "/doctor/appointments", icon: "event" },
        { label: "Rx History", href: "/doctor/prescriptions", icon: "history" },
        { label: "Lab Reports", href: "/doctor/reports", icon: "science" },
        { label: "Messages", href: "/doctor/messages", icon: "chat" },
        { label: "Notifications", href: "/doctor/notifications", icon: "notifications" },
        { label: "My Profile", href: "/doctor/profile", icon: "person" },
      ]}
    >
      <PatientDrawerProvider>{children}</PatientDrawerProvider>
    </AppShell>
  );
}
