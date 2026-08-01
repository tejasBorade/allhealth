import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["staff"]);

  return (
    <AppShell
      title="Staff"
      navItems={[
        { label: "Dashboard", href: "/staff", icon: DashboardIcon },
        { label: "Billing", href: "/staff/billing", icon: ReceiptIcon },
        { label: "Medical Reports", href: "/staff/reports", icon: UploadFileIcon },
      ]}
    >
      {children}
    </AppShell>
  );
}
