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
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ContactEmergencyOutlinedIcon from "@mui/icons-material/ContactEmergencyOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { theme } from "@/lib/theme";
import type { Tables } from "@/lib/supabase/types";
import { updatePatientProfile } from "./actions";

type ProfileRow = Pick<Tables<"profiles">, "full_name" | "phone" | "data_consent_at">;
type PatientRow = Pick<
  Tables<"patients">,
  | "date_of_birth"
  | "gender"
  | "address"
  | "allergies"
  | "blood_group"
  | "chronic_conditions"
  | "emergency_contact_name"
  | "emergency_contact_phone"
  | "abha_number"
>;

function SectionHeader({
  icon,
  label,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  color?: "primary" | "secondary" | "warning";
}) {
  return (
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
          bgcolor: alpha(theme.palette[color].main, 0.12),
          color: theme.palette[color].main,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default function ProfileForm({
  profile,
  patient,
}: {
  profile: ProfileRow | null;
  patient: PatientRow | null;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setSuccess(false);
    const result = await updatePatientProfile(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    // This is an edit-in-place form, not an "add another" form — the fields
    // already show the values that were just saved, so we leave them alone
    // instead of resetting (which would snap back to the stale initial
    // defaultValue props from before this submit).
    setSuccess(true);
  };

  return (
    <form ref={formRef} action={handleSubmit}>
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", mb: 3 }}>
        {profile?.data_consent_at ? (
          <Chip
            icon={<VerifiedRoundedIcon />}
            color="success"
            variant="outlined"
            label={`Data processing consent given on ${new Date(
              profile.data_consent_at
            ).toLocaleDateString()}`}
          />
        ) : (
          <Chip variant="outlined" label="No consent record on file" />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated.
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader icon={<PersonOutlineRoundedIcon fontSize="small" />} label="Basic Info" />
          <Stack spacing={2}>
            <TextField
              name="full_name"
              label="Full name"
              defaultValue={profile?.full_name ?? ""}
              required
            />
            <TextField name="phone" label="Phone" defaultValue={profile?.phone ?? ""} />
            <TextField
              name="date_of_birth"
              label="Date of birth"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              defaultValue={patient?.date_of_birth ?? ""}
              sx={{ maxWidth: 260 }}
            />
            <TextField
              name="gender"
              label="Gender"
              placeholder="e.g. Male, Female, Other"
              defaultValue={patient?.gender ?? ""}
            />
            <TextField
              name="address"
              label="Address"
              multiline
              minRows={2}
              defaultValue={patient?.address ?? ""}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon={<MedicalInformationOutlinedIcon fontSize="small" />}
            label="Medical Info"
            color="secondary"
          />
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.75 }}>
                <WarningAmberRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.dark" }}>
                  Allergies
                </Typography>
              </Stack>
              <TextField
                name="allergies"
                placeholder="e.g. Penicillin, peanuts..."
                multiline
                minRows={2}
                fullWidth
                defaultValue={patient?.allergies ?? ""}
                helperText="Visible to your doctors — please keep this accurate."
              />
            </Box>
            <TextField
              name="blood_group"
              label="Blood group"
              placeholder="e.g. O+"
              defaultValue={patient?.blood_group ?? ""}
              sx={{ maxWidth: 260 }}
            />
            <TextField
              name="chronic_conditions"
              label="Chronic conditions"
              multiline
              minRows={2}
              defaultValue={patient?.chronic_conditions ?? ""}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon={<ContactEmergencyOutlinedIcon fontSize="small" />}
            label="Emergency Contact"
          />
          <Stack spacing={2}>
            <TextField
              name="emergency_contact_name"
              label="Contact name"
              defaultValue={patient?.emergency_contact_name ?? ""}
            />
            <TextField
              name="emergency_contact_phone"
              label="Contact phone"
              defaultValue={patient?.emergency_contact_phone ?? ""}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon={<BadgeOutlinedIcon fontSize="small" />}
            label="ABHA Health ID"
            color="secondary"
          />
          <TextField
            name="abha_number"
            label="ABHA number"
            fullWidth
            defaultValue={patient?.abha_number ?? ""}
            helperText="Your Ayushman Bharat Health Account number, if you have one. Optional."
          />
        </CardContent>
      </Card>

      <Button type="submit" variant="contained" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
