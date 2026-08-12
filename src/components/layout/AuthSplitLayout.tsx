import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import { alpha } from "@mui/material/styles";
import { brandGradient } from "@/lib/theme";
import type { ReactNode } from "react";

const HIGHLIGHTS = [
  "Book appointments with approved doctors in seconds",
  "Prescriptions, reports, and records in one timeline",
  "Automatic email reminders so nothing gets missed",
];

export default function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "42%",
          minWidth: 420,
          p: 6,
          background: brandGradient,
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: alpha("#ffffff", 0.16),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FavoriteRoundedIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            FriendlyHealthy
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 3, letterSpacing: -0.5 }}>
            Healthcare, organized for everyone involved.
          </Typography>
          <Stack spacing={1.75}>
            {HIGHLIGHTS.map((h) => (
              <Stack key={h} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 20, mt: 0.2, color: "#22D3EE", flexShrink: 0 }} />
                <Typography sx={{ opacity: 0.92 }}>{h}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ opacity: 0.55 }}>
          Patients &bull; Doctors &bull; Doctor Staff &bull; Admins
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
