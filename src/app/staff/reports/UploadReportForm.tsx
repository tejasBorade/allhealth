"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import PatientSelect, { type PatientOption } from "@/components/PatientSelect";
import { uploadReport } from "./actions";

export default function UploadReportForm({ patients }: { patients: PatientOption[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
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
  };

  return (
    <Box component="form" ref={formRef} action={handleSubmit} sx={{ mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        <PatientSelect patients={patients} name="patientId" />
        <TextField
          name="reportType"
          label="Report type"
          placeholder="e.g. Blood test, X-ray"
          size="small"
          required
        />
        <Button variant="outlined" component="label">
          Choose file
          <input type="file" name="file" hidden required />
        </Button>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </Box>
    </Box>
  );
}
