"use client";

import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import StatusChip from "@/components/StatusChip";
import { theme } from "@/lib/theme";
import { usePatientDrawer } from "@/components/PatientDrawer/PatientDrawerContext";
import { updateAppointmentStatus } from "./actions";
import CompleteAppointmentDialog from "./CompleteAppointmentDialog";
import type { AppointmentStatus } from "@/lib/supabase/types";

function initialsFrom(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppointmentTableRow({
  appointmentId,
  patientId,
  patientName,
  when,
  status,
}: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  when: string;
  status: AppointmentStatus;
}) {
  const { openPatient } = usePatientDrawer();

  return (
    <TableRow>
      <TableCell>
        <Stack
          direction="row"
          spacing={1.25}
          onClick={() => openPatient(patientId, patientName)}
          sx={{ alignItems: "center", cursor: "pointer", display: "inline-flex" }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: 12,
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: "primary.main",
            }}
          >
            {initialsFrom(patientName)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
            {patientName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{when}</TableCell>
      <TableCell>
        <StatusChip status={status} />
      </TableCell>
      <TableCell align="right">
        {status === "scheduled" && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <CompleteAppointmentDialog appointmentId={appointmentId} />
            <form action={updateAppointmentStatus.bind(null, appointmentId, "cancelled")}>
              <Button type="submit" size="small" color="error">
                Cancel
              </Button>
            </form>
          </Stack>
        )}
        {status === "completed" && (
          <Button size="small" href={`/appointments/${appointmentId}/report`} target="_blank">
            View report
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
