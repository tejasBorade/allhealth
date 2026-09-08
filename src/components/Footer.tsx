import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export default function Footer({ sx }: { sx?: SxProps<Theme> }) {
  const year = new Date().getFullYear();
  return (
    <Typography variant="caption" sx={{ display: "block", ...sx }}>
      © {year} FriendlyHealthy. All rights reserved.
    </Typography>
  );
}
