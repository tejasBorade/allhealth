"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { bookAppointment } from "./actions";

export default function BookAppointmentButton({
  doctorId,
  doctorName,
}: {
  doctorId: string;
  doctorName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await bookAppointment(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  };

  return (
    <>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        Book appointment
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Book with Dr. {doctorName}</DialogTitle>
        <form action={handleSubmit}>
          <DialogContent>
            <input type="hidden" name="doctorId" value={doctorId} />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Appointment booked.
              </Alert>
            )}
            <TextField
              name="appointmentAt"
              label="Date & time"
              type="datetime-local"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={success}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>{success ? "Close" : "Cancel"}</Button>
            {!success && (
              <Button type="submit" variant="contained" disabled={pending}>
                {pending ? "Booking..." : "Book"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
