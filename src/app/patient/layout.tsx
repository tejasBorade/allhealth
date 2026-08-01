import DashboardIcon from "@mui/icons-material/Dashboard";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";
import MedicationIcon from "@mui/icons-material/Medication";
import FolderIcon from "@mui/icons-material/Folder";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { requireRole } from "@/lib/auth/requireRole";
import AppShell from "@/components/layout/AppShell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["patient"]);

  return (
    <AppShell
      title="Patient"
      navItems={[
        { label: "Dashboard", href: "/patient", icon: DashboardIcon },
        { label: "Find a Doctor", href: "/patient/doctors", icon: SearchIcon },
        { label: "Appointments", href: "/patient/appointments", icon: EventIcon },
        { label: "Prescriptions", href: "/patient/prescriptions", icon: MedicationIcon },
        { label: "Medical Records", href: "/patient/medical-records", icon: FolderIcon },
        { label: "Billing", href: "/patient/billing", icon: ReceiptIcon },
      ]}
    >
      {children}
    </AppShell>
  );
}
