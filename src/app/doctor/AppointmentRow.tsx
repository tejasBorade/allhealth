"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { alpha } from "@mui/material/styles";
import StatusChip from "@/components/StatusChip";
import { theme } from "@/lib/theme";
import { usePatientDrawer } from "@/components/PatientDrawer/PatientDrawerContext";
import type { AppointmentStatus } from "@/lib/supabase/types";

export default function AppointmentRow({
  patientId,
  patientName,
  time,
  status,
}: {
  patientId: string;
  patientName: string;
  time: string;
  status: AppointmentStatus;
}) {
  const { openPatient } = usePatientDrawer();

  return (
    <Stack
      direction="row"
      spacing={1.5}
      onClick={() => openPatient(patientId, patientName)}
      sx={{
        alignItems: "center",
        py: 1.25,
        px: 0.5,
        borderTop: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        borderRadius: 1.5,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Typography variant="body2" sx={{ fontFamily: "monospace", width: 70, flexShrink: 0 }}>
        {time}
      </Typography>
      <Avatar
        sx={{ width: 32, height: 32, fontSize: 13, bgcolor: alpha(theme.palette.primary.main, 0.14), color: "primary.main" }}
      >
        {patientName
          .split(" ")
          .map((p: string) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
        {patientName}
      </Typography>
      <StatusChip status={status} />
    </Stack>
  );
}
