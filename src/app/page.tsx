import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinkButton from "@/components/LinkButton";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role ?? "patient";
    redirect(`/${role}`);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: 700 }}>
        FriendlyHealthy
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560 }}>
        One place for doctors, doctor staff, and patients to manage
        appointments, prescriptions, medical records, and billing.
      </Typography>
      <Stack direction="row" spacing={2}>
        <LinkButton href="/login" variant="contained" size="large">
          Sign in
        </LinkButton>
        <LinkButton href="/register" variant="outlined" size="large">
          Register
        </LinkButton>
      </Stack>
    </Box>
  );
}
