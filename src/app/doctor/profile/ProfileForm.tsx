"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { theme } from "@/lib/theme";
import { updateDoctorProfile } from "./actions";

interface ProfileFormProps {
  fullName: string;
  phone: string;
  specialization: string;
  clinicName: string;
  bio: string;
  registrationNumber: string;
  qualifications: string;
  clinicAddress: string;
  clinicPhone: string;
}

export default function ProfileForm({
  fullName,
  phone,
  specialization,
  clinicName,
  bio,
  registrationNumber,
  qualifications,
  clinicAddress,
  clinicPhone,
}: ProfileFormProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setSuccess(false);
    const result = await updateDoctorProfile(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          >
            <PersonOutlineOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Personal & clinic details
          </Typography>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated.
          </Alert>
        )}
        <form ref={formRef} action={handleSubmit}>
          <Stack spacing={2}>
            <TextField name="fullName" label="Full name" required defaultValue={fullName} />
            <TextField name="phone" label="Phone" defaultValue={phone} />
            <TextField name="specialization" label="Specialization" defaultValue={specialization} />
            <TextField name="clinicName" label="Clinic/Hospital Name" defaultValue={clinicName} />
            <TextField name="bio" label="Bio" multiline minRows={3} defaultValue={bio} />

            <Alert severity="info" sx={{ mt: 1 }}>
              These next fields print on every prescription. Under India&apos;s Drugs &amp; Cosmetics
              Act, a prescription without your registration number is legally void.
            </Alert>
            <TextField
              name="qualifications"
              label="Qualifications"
              placeholder="e.g. MBBS, MD (Cardiology)"
              defaultValue={qualifications}
            />
            <TextField
              name="registrationNumber"
              label="Medical registration number"
              placeholder="e.g. MH-12345 (State Council / NMC)"
              defaultValue={registrationNumber}
            />
            <TextField name="clinicAddress" label="Clinic address" multiline minRows={2} defaultValue={clinicAddress} />
            <TextField name="clinicPhone" label="Clinic phone" defaultValue={clinicPhone} />

            <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "start" }}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
