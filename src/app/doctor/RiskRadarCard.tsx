"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TroubleshootRoundedIcon from "@mui/icons-material/TroubleshootRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
import EmptyState from "@/components/EmptyState";
import { usePatientDrawer } from "@/components/PatientDrawer/PatientDrawerContext";
import { useToast } from "@/components/providers/ToastProvider";
import { refreshRiskDigest, dismissRiskDigestRow } from "./riskDigestActions";

export interface RiskDigestRow {
  id: string;
  patientId: string;
  fullName: string;
  adherencePctRecent: number | null;
  adherencePctPrior: number | null;
  vitalsNote: string | null;
  summaryText: string | null;
  suggestedAction: string | null;
}

function initialsFrom(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RiskRadarCard({ rows }: { rows: RiskDigestRow[] }) {
  const { openPatient } = usePatientDrawer();
  const toast = useToast();
  const [refreshing, setRefreshing] = React.useState(false);
  const [dismissingId, setDismissingId] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRiskDigest();
      toast("Risk radar refreshed.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to refresh.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      await dismissRiskDigestRow(id);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to dismiss.", "error");
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <Card>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="subtitle1">🧭 Patient Risk Radar</Typography>
          <Typography variant="caption" color="text.secondary">
            AI-assisted observations from recorded data — not a diagnosis. Always confirm against the full chart.
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleRefresh}
          disabled={refreshing}
          startIcon={<RefreshRoundedIcon fontSize="small" />}
          sx={{ flexShrink: 0 }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>
      <Box sx={{ px: 2.5, pb: 2 }}>
        {rows.length === 0 && (
          <EmptyState
            icon={TroubleshootRoundedIcon}
            title="Nothing flagged"
            description="Patients whose adherence or vitals are trending the wrong way will show up here."
          />
        )}
        {rows.map((row, i) => (
          <Stack
            key={row.id}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "flex-start", py: 1.25, borderTop: i === 0 ? "none" : "1px solid", borderColor: "divider" }}
          >
            <Avatar
              onClick={() => openPatient(row.patientId, row.fullName)}
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                mt: 0.25,
                cursor: "pointer",
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                color: "primary.main",
              }}
            >
              {initialsFrom(row.fullName)}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography
                  variant="body2"
                  onClick={() => openPatient(row.patientId, row.fullName)}
                  sx={{ fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                >
                  {row.fullName}
                </Typography>
                <Chip
                  label={row.vitalsNote ? "Vitals trending" : "Adherence dropping"}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.14),
                    color: theme.palette.warning.dark,
                  }}
                />
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {row.summaryText ??
                  row.vitalsNote ??
                  (row.adherencePctRecent !== null
                    ? `Adherence at ${row.adherencePctRecent}%${row.adherencePctPrior !== null ? ` (was ${row.adherencePctPrior}%)` : ""} over the last 2 weeks.`
                    : "Flagged for review.")}
              </Typography>
              {row.suggestedAction && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  Suggested: {row.suggestedAction}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={() => handleDismiss(row.id)}
              disabled={dismissingId === row.id}
              aria-label="Dismiss"
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Box>
    </Card>
  );
}
