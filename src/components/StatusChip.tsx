import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";

type SemanticColor = "success" | "warning" | "error" | "info";

// Every status string used across appointments/billing/approvals maps to one
// semantic color so the same word always reads the same way anywhere in the app.
const STATUS_COLOR: Record<string, SemanticColor> = {
  scheduled: "info",
  completed: "success",
  cancelled: "error",
  pending: "warning",
  paid: "success",
  approved: "success",
  reviewed: "success",
  critical: "error",
};

export default function StatusChip({
  status,
  size = "small",
}: {
  status: string;
  size?: "small" | "medium";
}) {
  const color = STATUS_COLOR[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const sx = color
    ? { bgcolor: alpha(theme.palette[color].main, 0.14), color: theme.palette[color].dark }
    : { bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary };

  return <Chip label={label} size={size} sx={sx} />;
}
