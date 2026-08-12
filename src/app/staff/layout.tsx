import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["staff"]);

  return (
    <AppShell
      title="Staff Dashboard"
      userName={profile.full_name}
      userId={user.id}
      role="staff"
      navItems={[
        { label: "Dashboard", href: "/staff", icon: "dashboard" },
        { label: "Billing", href: "/staff/billing", icon: "receipt" },
        { label: "Medical Reports", href: "/staff/reports", icon: "uploadFile" },
        { label: "Notifications", href: "/staff/notifications", icon: "notifications" },
        { label: "My Profile", href: "/staff/profile", icon: "person" },
      ]}
    >
      {children}
    </AppShell>
  );
}
