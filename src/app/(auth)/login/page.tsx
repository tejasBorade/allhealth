"use client";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import { createClient } from "@/lib/supabase/client";
import AuthSplitLayout from "@/components/layout/AuthSplitLayout";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error || !data.user) {
      setServerError(error?.message ?? "Unable to sign in.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role ?? "patient";
    router.push(`/${role}`);
    router.refresh();
  };

  return (
    <AuthSplitLayout>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: "100%", maxWidth: 400 }}>
        <Typography variant="h4" sx={{ mb: 0.75 }}>
          Welcome back
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue to your dashboard.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

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
          {...register("password", { required: "Password is required" })}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          No account?{" "}
          <MuiLink component={NextLink} href="/register" sx={{ fontWeight: 600 }}>
            Register
          </MuiLink>
        </Typography>
      </Box>
    </AuthSplitLayout>
  );
}
