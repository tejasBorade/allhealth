"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { addMedicalRecord } from "./actions";

export default function AddRecordForm({ patientId }: { patientId: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await addMedicalRecord(patientId, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add a medical record
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form ref={formRef} action={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              name="recordType"
              label="Record type"
              placeholder="e.g. Checkup, Lab result, Consultation note"
              required
              size="small"
            />
            <TextField name="notes" label="Notes" required multiline minRows={3} />
            <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "start" }}>
              {pending ? "Saving..." : "Save record"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
