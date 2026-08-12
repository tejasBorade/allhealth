"use client";

import * as React from "react";
import NextLink from "next/link";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import { alpha } from "@mui/material/styles";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { createClient } from "@/lib/supabase/client";
import AuthSplitLayout from "@/components/layout/AuthSplitLayout";
import type { UserRole } from "@/lib/types";

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  dataConsent: boolean;
}

const ROLE_OPTIONS: { value: Exclude<UserRole, "admin">; label: string; icon: typeof PersonRoundedIcon }[] = [
  { value: "patient", label: "Patient", icon: PersonRoundedIcon },
  { value: "doctor", label: "Doctor", icon: MedicalServicesRoundedIcon },
  { value: "staff", label: "Doctor Staff", icon: BadgeRoundedIcon },
];

export default function RegisterPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<Exclude<UserRole, "admin"> | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { role: "patient", dataConsent: false } });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { role: values.role, full_name: values.fullName, data_consent: values.dataConsent },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSubmitted(values.role);
  };

  if (submitted) {
    return (
      <AuthSplitLayout>
        <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <Box
            sx={(theme) => ({
              width: 64,
              height: 64,
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.main,
            })}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h5" sx={{ mb: 1.5 }}>
            Check your email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Confirm your address to activate your account.
          </Typography>
          {submitted !== "patient" && (
            <Alert severity="info" sx={{ textAlign: "left", mb: 2 }}>
              {submitted === "doctor" ? "Doctor" : "Staff"} accounts also need admin
              approval before you can sign in — you&apos;ll be notified once approved.
            </Alert>
          )}
          <MuiLink component={NextLink} href="/login" sx={{ fontWeight: 600 }}>
            Back to sign in
          </MuiLink>
        </Box>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: "100%", maxWidth: 420 }}
      >
        <Typography variant="h4" sx={{ mb: 0.75 }}>
          Create an account
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Get set up in a minute.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          I am a
        </Typography>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
              {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = field.value === value;
                return (
                  <Box
                    key={value}
                    onClick={() => field.onChange(value)}
                    sx={(theme) => ({
                      flex: 1,
                      cursor: "pointer",
                      textAlign: "center",
                      py: 2,
                      px: 1,
                      borderRadius: "14px",
                      border: `1.5px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
                      bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: theme.palette.primary.main },
                    })}
                  >
                    <Icon
                      sx={{
                        color: active ? "primary.main" : "text.secondary",
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 600,
                        color: active ? "primary.main" : "text.secondary",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        />

        <TextField
          label="Full name"
          fullWidth
          margin="normal"
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          {...register("fullName", { required: "Full name is required" })}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" },
          })}
        />

        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            sx={{ alignItems: "flex-start", ml: 0 }}
            control={
              <Checkbox
                size="small"
                sx={{ pt: 0.25 }}
                {...register("dataConsent", { required: "Consent is required to create an account" })}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I consent to FriendlyHealthy processing my health data to provide care,
                in line with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023.
              </Typography>
            }
          />
          {errors.dataConsent && (
            <FormHelperText error sx={{ ml: 1.5 }}>
              {errors.dataConsent.message}
            </FormHelperText>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 1.5 }}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          Already have an account?{" "}
          <MuiLink component={NextLink} href="/login" sx={{ fontWeight: 600 }}>
            Sign in
          </MuiLink>
        </Typography>
      </Box>
    </AuthSplitLayout>
  );
}
