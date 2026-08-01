import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { approveProfile } from "./actions";
import type { Profile } from "@/lib/types";

export default async function AdminDashboard() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, approved")
    .eq("approved", false)
    .neq("role", "patient")
    .order("created_at", { ascending: true });

  const pendingProfiles = (pending ?? []) as Profile[];

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Pending doctor / staff approvals
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Doctor and staff accounts can&apos;t sign in until approved here.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No pending approvals.
                </TableCell>
              </TableRow>
            )}
            {pendingProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>{profile.full_name ?? "—"}</TableCell>
                <TableCell>
                  <Chip label={profile.role} size="small" />
                </TableCell>
                <TableCell>{profile.phone ?? "—"}</TableCell>
                <TableCell align="right">
                  <form action={approveProfile.bind(null, profile.id)}>
                    <Button type="submit" variant="contained" size="small">
                      Approve
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
