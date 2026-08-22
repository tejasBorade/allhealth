"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { alpha } from "@mui/material/styles";
import PhonelinkLockRoundedIcon from "@mui/icons-material/PhonelinkLockRounded";
import { theme } from "@/lib/theme";
import { useToast } from "@/components/providers/ToastProvider";
import { hasMpin, setMpin, clearMpin } from "@/lib/mobile/mpin";

const PIN_LENGTH = 6;

function SectionHeader({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
        }}
      >
        <PhonelinkLockRoundedIcon fontSize="small" />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default function MobilePinSettings() {
  const [isNative, setIsNative] = React.useState(false);
  const [pinSet, setPinSet] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [step, setStep] = React.useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      if (native) setPinSet(await hasMpin());
    })();
  }, []);

  if (!isNative) return null;

  const openDialog = () => {
    setStep("enter");
    setFirstPin("");
    setPin("");
    setError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleContinue = () => {
    if (pin.length !== PIN_LENGTH) {
      setError(`PIN must be ${PIN_LENGTH} digits.`);
      return;
    }
    setFirstPin(pin);
    setPin("");
    setError(null);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (pin !== firstPin) {
      setError("PINs didn't match — try again.");
      setPin("");
      setStep("enter");
      setFirstPin("");
      return;
    }
    setSaving(true);
    try {
      await setMpin(pin);
      setPinSet(true);
      setDialogOpen(false);
      toast("Device PIN set.", "success");
    } catch {
      setError("Couldn't save the PIN on this device.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    await clearMpin();
    setPinSet(false);
    toast("Device PIN removed.", "success");
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader label="Device unlock PIN" />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set a {PIN_LENGTH}-digit PIN to quickly unlock the app on this device instead of signing in again.
          It&apos;s stored securely on this device only.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={openDialog}>
            {pinSet ? "Change PIN" : "Set up PIN"}
          </Button>
          {pinSet && (
            <Button color="error" onClick={handleRemove}>
              Remove PIN
            </Button>
          )}
        </Stack>
      </CardContent>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{step === "enter" ? "Set a device PIN" : "Confirm your PIN"}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            type="password"
            label={step === "enter" ? "New PIN" : "Re-enter PIN"}
            value={pin}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
              setPin(digits);
            }}
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: PIN_LENGTH } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          {step === "enter" ? (
            <Button variant="contained" onClick={handleContinue} disabled={pin.length !== PIN_LENGTH}>
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={pin.length !== PIN_LENGTH || saving}
            >
              {saving ? "Saving..." : "Save PIN"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
}
