import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["patient", "doctor", "staff", "admin"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await requireRole(["admin"]);
  const { role } = await searchParams;
  const activeRole = (ROLES.includes(role as UserRole) ? role : "patient") as UserRole;

  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, approved, created_at")
    .eq("role", activeRole)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="All users" subtitle="Browse everyone registered in the system by role." />

      <Tabs value={activeRole} sx={{ mb: 2 }}>
        {ROLES.map((r) => (
          <Tab
            key={r}
            label={r}
            value={r}
            component="a"
            href={`/admin/users?role=${r}`}
            sx={{ textTransform: "capitalize" }}
          />
        ))}
      </Tabs>

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState
                    icon={GroupOutlinedIcon}
                    title={`No ${activeRole} accounts yet`}
                    description={`${activeRole.charAt(0).toUpperCase()}${activeRole.slice(1)} accounts will show up here once registered.`}
                  />
                </TableCell>
              </TableRow>
            )}
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name ?? "—"}</TableCell>
                <TableCell>{u.phone ?? "—"}</TableCell>
                <TableCell>
                  <StatusChip status={u.approved ? "approved" : "pending"} />
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
