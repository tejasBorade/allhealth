import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);

  return (
    <AppShell
      title="Admin"
      navItems={[
        { label: "Approvals", href: "/admin", icon: DashboardIcon },
        { label: "All Users", href: "/admin/users", icon: GroupIcon },
      ]}
    >
      {children}
    </AppShell>
  );
}
