import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function PatientBillingPage() {
  const { user } = await requireRole(["patient"]);

  const supabase = await createClient();
  const { data: bills, error } = await supabase
    .from("billing")
    .select("id, amount, status, created_at")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Billing
      </Typography>

      {error && <Typography color="error">{error.message}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(bills ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No billing records yet.
                </TableCell>
              </TableRow>
            )}
            {(bills ?? []).map((bill) => (
              <TableRow key={bill.id}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
