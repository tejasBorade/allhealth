import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinkButton from "@/components/LinkButton";

export default function UnauthorizedPage() {
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
      <Paper sx={{ p: 4, width: 420, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
          Not authorized
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your account doesn&apos;t have access to that page.
        </Typography>
        <LinkButton href="/login" variant="contained">
          Back to sign in
        </LinkButton>
      </Paper>
    </Box>
  );
}
