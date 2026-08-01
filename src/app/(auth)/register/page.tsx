"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "admin">;
}

export default function RegisterPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<Exclude<UserRole, "admin"> | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { role: "patient" } });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { role: values.role, full_name: values.fullName },
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
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Paper sx={{ p: 4, width: 420 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
            Check your email
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Confirm your address to activate your account.
          </Typography>
          {submitted !== "patient" && (
            <Alert severity="info">
              {submitted === "doctor" ? "Doctor" : "Staff"} accounts also need admin
              approval before you can sign in — you&apos;ll be notified once approved.
            </Alert>
          )}
          <Typography variant="body2" sx={{ mt: 3 }}>
            <Link href="/login">Back to sign in</Link>
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper sx={{ p: 4, width: 420 }} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
          Create an account
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
          I am a
        </Typography>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={field.value}
              onChange={(_, value) => value && field.onChange(value)}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="patient">Patient</ToggleButton>
              <ToggleButton value="doctor">Doctor</ToggleButton>
              <ToggleButton value="staff">Doctor Staff</ToggleButton>
            </ToggleButtonGroup>
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

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
