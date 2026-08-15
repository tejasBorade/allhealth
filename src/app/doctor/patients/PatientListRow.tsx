"use client";

import Link from "next/link";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { usePatientDrawer } from "@/components/PatientDrawer/PatientDrawerContext";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function PatientListRow({
  patient,
}: {
  patient: { id: string; full_name: string | null; phone: string | null };
}) {
  const { openPatient } = usePatientDrawer();

  return (
    <ListItemButton onClick={() => openPatient(patient.id, patient.full_name ?? undefined)}>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: "primary.main" }}>{initials(patient.full_name)}</Avatar>
      </ListItemAvatar>
      <ListItemText primary={patient.full_name ?? "Unnamed patient"} secondary={patient.phone ?? undefined} />
      <Tooltip title="Open full chart">
        <IconButton
          component={Link}
          href={`/doctor/patients/${patient.id}`}
          onClick={(e) => e.stopPropagation()}
          size="small"
          aria-label="Open full chart"
        >
          <ChevronRightRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </ListItemButton>
  );
}
