import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import BookAppointmentButton from "./BookAppointmentButton";

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
      <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
        Find a doctor
      </Typography>

      <Box component="form" sx={{ mb: 3 }}>
        <TextField
          name="q"
          label="Search by specialization"
          defaultValue={q ?? ""}
          size="small"
          sx={{ width: 320 }}
        />
      </Box>

      {error && <Typography color="error">{error.message}</Typography>}

      <Grid container spacing={2}>
        {(doctors ?? []).map((doctor) => {
          const profile = Array.isArray(doctor.profiles)
            ? doctor.profiles[0]
            : doctor.profiles;
          return (
            <Grid key={doctor.profile_id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">
                    Dr. {profile?.full_name ?? "Unnamed"}
                  </Typography>
                  {doctor.specialization && (
                    <Chip label={doctor.specialization} size="small" sx={{ mb: 1 }} />
                  )}
                  {doctor.clinic_name && (
                    <Typography variant="body2" color="text.secondary">
                      {doctor.clinic_name}
                    </Typography>
                  )}
                  {doctor.bio && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {doctor.bio}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <BookAppointmentButton
                      doctorId={doctor.profile_id}
                      doctorName={profile?.full_name ?? "the doctor"}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {(doctors ?? []).length === 0 && !error && (
          <Grid size={12}>
            <Typography color="text.secondary">No doctors found.</Typography>
          </Grid>
        )}
      </Grid>
    </>
  );
}
