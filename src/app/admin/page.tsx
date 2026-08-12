import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { approveProfile } from "./actions";
import { theme } from "@/lib/theme";
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
      <PageHeader
        title="Pending doctor / staff approvals"
        subtitle="Doctor and staff accounts can't sign in until approved here."
      />

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
                <TableCell colSpan={4}>
                  <EmptyState
                    icon={HowToRegRoundedIcon}
                    title="No pending approvals"
                    description="New doctor and staff sign-ups will appear here for review."
                  />
                </TableCell>
              </TableRow>
            )}
            {pendingProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>{profile.full_name ?? "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={profile.role}
                    size="small"
                    sx={{
                      textTransform: "capitalize",
                      bgcolor: alpha(theme.palette.secondary.main, 0.14),
                      color: theme.palette.secondary.dark,
                    }}
                  />
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
