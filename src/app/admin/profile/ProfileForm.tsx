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
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { theme } from "@/lib/theme";
import { updateAdminProfile } from "./actions";

export default function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setSuccess(false);
    const result = await updateAdminProfile(formData);
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
              bgcolor: alpha(theme.palette.secondary.main, 0.12),
              color: theme.palette.secondary.main,
            }}
          >
            <PersonOutlineRoundedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Profile details
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
        <form action={handleSubmit}>
          <Stack spacing={2}>
            <TextField name="fullName" label="Full name" defaultValue={fullName} required />
            <TextField name="phone" label="Phone" defaultValue={phone} />
            <Button
              type="submit"
              variant="contained"
              disabled={pending}
              sx={{ alignSelf: "start" }}
            >
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
