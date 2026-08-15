"use client";

import * as React from "react";
import Link from "next/link";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmptyState from "@/components/EmptyState";
import { getPatientDrawerSummary, type PatientDrawerSummary } from "@/app/doctor/patients/actions";

const DRAWER_WIDTH = 480;

export default function PatientDrawer({
  patientId,
  patientName,
  onClose,
}: {
  patientId: string | null;
  patientName?: string;
  onClose: () => void;
}) {
  const [summary, setSummary] = React.useState<PatientDrawerSummary | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!patientId) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setSummary(null);
    setLoading(true);
    getPatientDrawerSummary(patientId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary({ ...emptySummary(patientId), error: "Failed to load patient." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const open = patientId !== null;
  const displayName = summary?.fullName ?? patientName ?? "Patient";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1400,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, maxWidth: "100vw" },
      }}
    >
      <Box sx={{ width: DRAWER_WIDTH, maxWidth: "100vw", height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" noWrap>
                {displayName}
              </Typography>
              {summary?.phone && (
                <Typography variant="body2" color="text.secondary">
                  {summary.phone}
                </Typography>
              )}
            </Box>
            <IconButton onClick={onClose} aria-label="Close" size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          {patientId && (
            <Button
              component={Link}
              href={`/doctor/patients/${patientId}`}
              onClick={onClose}
              variant="contained"
              fullWidth
              endIcon={<ArrowForwardRoundedIcon />}
            >
              View Full Chart
            </Button>
          )}
        </Box>

        <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && summary?.error && <Alert severity="error">{summary.error}</Alert>}

          {!loading && summary && !summary.error && (
            <Stack spacing={3}>
              {summary.allergies && summary.allergies.trim() !== "" && (
                <Alert severity="warning" sx={{ fontWeight: 600 }}>
                  ⚠ Known allergy: {summary.allergies} — verify before prescribing.
                </Alert>
              )}

              <Stack direction="row" spacing={1.5}>
                <StatBox label="Active meds" value={summary.activeMedicines.length} />
                <StatBox
                  label="Adherence (30d)"
                  value={summary.adherencePct !== null ? `${summary.adherencePct}%` : "—"}
                />
                <StatBox label="Blood group" value={summary.bloodGroup ?? "—"} />
              </Stack>

              {(summary.bloodGroup || summary.chronicConditions || summary.abhaNumber) && (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {summary.bloodGroup && (
                    <Chip size="small" color="info" variant="outlined" label={`Blood group: ${summary.bloodGroup}`} />
                  )}
                  {summary.abhaNumber && (
                    <Chip size="small" variant="outlined" label={`ABHA: ${summary.abhaNumber}`} />
                  )}
                  {summary.chronicConditions && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={`Chronic conditions: ${summary.chronicConditions}`}
                    />
                  )}
                </Stack>
              )}

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
                  Active medicines
                </Typography>
                {summary.activeMedicines.length === 0 ? (
                  <EmptyState icon={MedicationOutlinedIcon} title="No active medicines" />
                ) : (
                  <Stack spacing={1}>
                    {summary.activeMedicines.map((med) => (
                      <Box key={med.id} sx={{ p: 1.25, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {med.medicationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {med.dosage} · {med.frequencyCode}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
                  Recent medical records
                </Typography>
                {summary.recentRecords.length === 0 ? (
                  <EmptyState icon={DescriptionOutlinedIcon} title="No medical records yet" />
                ) : (
                  <Stack spacing={1}>
                    {summary.recentRecords.map((record) => (
                      <Box
                        key={record.id}
                        sx={{ p: 1.25, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                          <Chip label={record.recordType} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {record.notes}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

function emptySummary(patientId: string): PatientDrawerSummary {
  return {
    patientId,
    fullName: null,
    phone: null,
    dateOfBirth: null,
    gender: null,
    allergies: null,
    bloodGroup: null,
    chronicConditions: null,
    abhaNumber: null,
    activeMedicines: [],
    recentRecords: [],
    adherencePct: null,
  };
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: "background.default", textAlign: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
