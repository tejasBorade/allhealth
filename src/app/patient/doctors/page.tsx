import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import BookAppointmentButton from "./BookAppointmentButton";

function initialsFrom(name?: string | null) {
  if (!name) return "Dr";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "Dr";
}

export default async function DoctorSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["patient"]);
  const { q } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("doctors")
    .select("profile_id, specialization, clinic_name, bio, profiles!inner(full_name)")
    .eq("profiles.approved", true);

  if (q) {
    query = query.ilike("specialization", `%${q}%`);
  }

  const { data: doctors, error } = await query;

  return (
    <>
      <PageHeader
        title="Find a doctor"
        subtitle="Search approved doctors by specialization and book an appointment in a few clicks."
      />

      <Box component="form" sx={{ mb: 3 }}>
        <TextField
          name="q"
          label="Search by specialization"
          defaultValue={q ?? ""}
          sx={{ width: { xs: "100%", sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && <Typography color="error">{error.message}</Typography>}

      <Grid container spacing={2.5}>
        {(doctors ?? []).map((doctor) => {
          const profile = Array.isArray(doctor.profiles)
            ? doctor.profiles[0]
            : doctor.profiles;
          return (
            <Grid key={doctor.profile_id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                        fontWeight: 700,
                      }}
                    >
                      {initialsFrom(profile?.full_name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        Dr. {profile?.full_name ?? "Unnamed"}
                      </Typography>
                      {doctor.clinic_name && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                          <LocationOnRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {doctor.clinic_name}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>

                  {doctor.specialization && (
                    <Chip
                      label={doctor.specialization}
                      size="small"
                      sx={{
                        mb: 1.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        color: theme.palette.secondary.dark,
                      }}
                    />
                  )}
                  {doctor.bio && (
                    <Typography variant="body2" color="text.secondary">
                      {doctor.bio}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <BookAppointmentButton
                    doctorId={doctor.profile_id}
                    doctorName={profile?.full_name ?? "the doctor"}
                  />
                </CardActions>
              </Card>
            </Grid>
          );
        })}
        {(doctors ?? []).length === 0 && !error && (
          <Grid size={12}>
            <EmptyState
              icon={PersonSearchRoundedIcon}
              title="No doctors found"
              description="Try a different specialization or clear your search to see everyone."
            />
          </Grid>
        )}
      </Grid>
    </>
  );
}
