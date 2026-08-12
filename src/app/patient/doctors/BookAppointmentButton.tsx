"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
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
      <Button
        variant="contained"
        size="small"
        fullWidth
        startIcon={<EventAvailableRoundedIcon />}
        onClick={() => setOpen(true)}
      >
        Book appointment
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <EventAvailableRoundedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Book appointment
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              with Dr. {doctorName}
            </Typography>
          </Box>
        </DialogTitle>
        <form action={handleSubmit}>
          <DialogContent sx={{ pt: 0 }}>
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
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              {success ? "Close" : "Cancel"}
            </Button>
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
