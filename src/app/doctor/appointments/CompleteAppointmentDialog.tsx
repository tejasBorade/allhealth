"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useToast } from "@/components/providers/ToastProvider";
import { completeAppointmentWithReport } from "./actions";

export default function CompleteAppointmentDialog({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    try {
      await completeAppointmentWithReport(appointmentId, formData);
      toast("Visit completed — report emailed to the patient.", "success");
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete the appointment.";
      setError(message);
      toast(message, "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        Mark completed
      </Button>
      <Dialog open={open} onClose={() => !pending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete visit</DialogTitle>
        <form action={handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Add a quick summary — it&apos;s saved to the patient&apos;s record and emailed to them
              as a visit report.
            </DialogContentText>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField name="chief_complaint" label="Chief complaint" multiline minRows={2} />
              <Stack direction="row" spacing={2}>
                <TextField name="bp_systolic" label="BP systolic" type="number" size="small" fullWidth />
                <TextField name="bp_diastolic" label="BP diastolic" type="number" size="small" fullWidth />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField name="pulse_bpm" label="Pulse (bpm)" type="number" size="small" fullWidth />
                <TextField
                  name="weight_kg"
                  label="Weight (kg)"
                  type="number"
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { step: "0.1" } }}
                />
              </Stack>
              <TextField name="advice" label="Advice / investigations" multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={pending} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Saving..." : "Complete & send report"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
