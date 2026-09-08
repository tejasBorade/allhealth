import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ReactNode } from "react";
import { theme } from "@/lib/theme";
import Footer from "@/components/Footer";

type AccentColor = "primary" | "warning" | "error" | "success";

export default function AuthMessageCard({
  icon: Icon,
  color = "primary",
  title,
  description,
  action,
}: {
  icon: SvgIconComponent;
  color?: AccentColor;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 3,
        position: "relative",
      }}
    >
      <Paper sx={{ p: 5, width: 440, textAlign: "center" }} variant="outlined">
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: theme.palette[color].main,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 4 : 0 }}>
          {description}
        </Typography>
        {action}
      </Paper>
      <Footer sx={{ position: "absolute", bottom: 16, color: "text.secondary" }} />
    </Box>
  );
}
