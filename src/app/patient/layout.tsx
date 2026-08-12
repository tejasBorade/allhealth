import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["patient"]);

  return (
    <AppShell
      title="Patient Dashboard"
      userName={profile.full_name}
      userId={user.id}
      role="patient"
      navItems={[
        { label: "Dashboard", href: "/patient", icon: "dashboard" },
        { label: "Find a Doctor", href: "/patient/doctors", icon: "search" },
        { label: "Appointments", href: "/patient/appointments", icon: "event" },
        { label: "Prescriptions", href: "/patient/prescriptions", icon: "medication" },
        { label: "Medical Records", href: "/patient/medical-records", icon: "folder" },
        { label: "Billing", href: "/patient/billing", icon: "receipt" },
        { label: "Messages", href: "/patient/messages", icon: "chat" },
        { label: "Notifications", href: "/patient/notifications", icon: "notifications" },
        { label: "My Profile", href: "/patient/profile", icon: "person" },
      ]}
    >
      {children}
    </AppShell>
  );
}
