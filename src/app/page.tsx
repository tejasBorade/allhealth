import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { alpha } from "@mui/material/styles";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import FolderSharedRoundedIcon from "@mui/icons-material/FolderSharedRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LinkButton from "@/components/LinkButton";
import { createClient } from "@/lib/supabase/server";
import { theme, brandGradient } from "@/lib/theme";

const FEATURES = [
  {
    icon: EventAvailableRoundedIcon,
    title: "Effortless booking",
    description: "Patients find approved doctors by specialization and book a slot in seconds.",
  },
  {
    icon: MedicationRoundedIcon,
    title: "Prescriptions that remind themselves",
    description: "Dosage and frequency drive automatic email reminders for every dose.",
  },
  {
    icon: FolderSharedRoundedIcon,
    title: "One shared medical history",
    description: "Doctor notes, lab reports, and past visits, always in one place.",
  },
  {
    icon: ReceiptLongRoundedIcon,
    title: "Simple billing",
    description: "Doctor staff raise and track bills tied directly to appointments.",
  },
];

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
    <Box sx={{ bgcolor: "background.default" }}>
      <Box sx={{ background: brandGradient, color: "#fff" }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={2}
            sx={{ py: 3, alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  bgcolor: alpha("#ffffff", 0.16),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FavoriteRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                FriendlyHealthy
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <LinkButton href="/login" sx={{ color: "#fff" }}>
                Sign in
              </LinkButton>
              <LinkButton
                href="/register"
                variant="contained"
                sx={{ bgcolor: "#fff", color: "primary.main", "&:hover": { bgcolor: alpha("#ffffff", 0.9) } }}
              >
                Register
              </LinkButton>
            </Stack>
          </Stack>

          <Stack
            spacing={3}
            sx={{ alignItems: "center", textAlign: "center", py: { xs: 8, md: 12 } }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -1, fontSize: { xs: 36, sm: 52 } }}>
              One place for doctors,
              <br />
              staff, and patients.
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 560, opacity: 0.9, fontWeight: 400 }}>
              Appointments, prescriptions, medical records, and billing —
              connected, and reminders sent automatically.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <LinkButton
                href="/register"
                variant="contained"
                size="large"
                sx={{ bgcolor: "#fff", color: "primary.main", "&:hover": { bgcolor: alpha("#ffffff", 0.9) } }}
              >
                Get started
              </LinkButton>
              <LinkButton
                href="/login"
                variant="outlined"
                size="large"
                sx={{ borderColor: alpha("#ffffff", 0.5), color: "#fff", "&:hover": { borderColor: "#fff" } }}
              >
                Sign in
              </LinkButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Grid container spacing={3}>
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: "100%", p: 1 }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
