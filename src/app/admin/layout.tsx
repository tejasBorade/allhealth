import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["admin"]);

  return (
    <AppShell
      title="Admin Dashboard"
      userName={profile.full_name}
      userId={user.id}
      role="admin"
      navItems={[
        { label: "Approvals", href: "/admin", icon: "dashboard" },
        { label: "All Users", href: "/admin/users", icon: "group" },
        { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
        { label: "My Profile", href: "/admin/profile", icon: "person" },
      ]}
    >
      {children}
    </AppShell>
  );
}
