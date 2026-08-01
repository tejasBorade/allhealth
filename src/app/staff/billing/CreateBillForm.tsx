"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import PatientSelect, { type PatientOption } from "@/components/PatientSelect";
import { createBill } from "./actions";

export default function CreateBillForm({ patients }: { patients: PatientOption[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await createBill(formData);
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
        <TextField name="amount" label="Amount" type="number" size="small" required />
        <Button type="submit" variant="contained">
          Add bill
        </Button>
      </Box>
    </Box>
  );
}
