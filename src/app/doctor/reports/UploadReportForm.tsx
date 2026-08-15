"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PatientSelect, { type PatientOption } from "@/components/PatientSelect";
import { uploadReport } from "./actions";

export default function UploadReportForm({ patients }: { patients: PatientOption[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await uploadReport(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setFileName(null);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Upload a lab report
        </Typography>
        <Box component="form" ref={formRef} action={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", sm: "flex-end" }, flexWrap: "wrap" }}
          >
            <Box sx={{ flex: "1 1 220px" }}>
              <PatientSelect patients={patients} name="patientId" />
            </Box>
            <TextField
              name="reportType"
              label="Report type"
              placeholder="e.g. Blood test, X-ray"
              required
              sx={{ flex: "1 1 200px" }}
            />
            <Button variant="outlined" component="label" sx={{ whiteSpace: "nowrap" }}>
              {fileName ?? "Choose file"}
              <input
                type="file"
                name="file"
                hidden
                required
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pending}
              startIcon={<UploadFileRoundedIcon />}
            >
              {pending ? "Uploading..." : "Upload"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
