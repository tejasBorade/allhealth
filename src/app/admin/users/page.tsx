import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
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
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        All users
      </Typography>

      <Tabs value={activeRole} sx={{ mb: 2 }}>
        {ROLES.map((r) => (
          <Tab key={r} label={r} value={r} component="a" href={`/admin/users?role=${r}`} />
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
                <TableCell colSpan={4} align="center">
                  No {activeRole} accounts yet.
                </TableCell>
              </TableRow>
            )}
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name ?? "—"}</TableCell>
                <TableCell>{u.phone ?? "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={u.approved ? "Approved" : "Pending"}
                    size="small"
                    color={u.approved ? "success" : "warning"}
                  />
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
