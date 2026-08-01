import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { updateBillStatus } from "./actions";
import CreateBillForm from "./CreateBillForm";

export default async function StaffBillingPage() {
  await requireRole(["staff"]);
  const supabase = await createClient();

  const [{ data: patients }, { data: bills, error }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "patient"),
    supabase
      .from("billing")
      .select("id, amount, status, created_at, patients(profiles(full_name))")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Billing
      </Typography>

      <CreateBillForm patients={patients ?? []} />

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(bills ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No billing records yet.
                </TableCell>
              </TableRow>
            )}
            {(bills ?? []).map((bill) => {
              const patient = Array.isArray(bill.patients) ? bill.patients[0] : bill.patients;
              const profile = patient
                ? Array.isArray(patient.profiles)
                  ? patient.profiles[0]
                  : patient.profiles
                : null;
              return (
                <TableRow key={bill.id}>
                  <TableCell>{profile?.full_name ?? "Unknown"}</TableCell>
                  <TableCell>{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(bill.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={bill.status}
                      size="small"
                      color={
                        bill.status === "paid"
                          ? "success"
                          : bill.status === "cancelled"
                            ? "default"
                            : "warning"
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    {bill.status === "pending" && (
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        <form action={updateBillStatus.bind(null, bill.id, "paid")}>
                          <Button type="submit" size="small">
                            Mark paid
                          </Button>
                        </form>
                        <form action={updateBillStatus.bind(null, bill.id, "cancelled")}>
                          <Button type="submit" size="small" color="error">
                            Cancel
                          </Button>
                        </form>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
