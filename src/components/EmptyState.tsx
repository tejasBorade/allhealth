import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export default function EmptyState({
  icon: Icon = InboxOutlinedIcon,
  title,
  description,
}: {
  icon?: SvgIconComponent;
  title: string;
  description?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 6,
        px: 2,
        color: "text.secondary",
      }}
    >
      <Icon sx={{ fontSize: 40, mb: 1.5, opacity: 0.35 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 320 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
