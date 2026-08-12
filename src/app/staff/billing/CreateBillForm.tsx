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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Create a new bill
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
            <Box sx={{ flex: "1 1 260px" }}>
              <PatientSelect patients={patients} name="patientId" />
            </Box>
            <TextField
              name="amount"
              label="Amount"
              type="number"
              required
              sx={{ minWidth: 160 }}
            />
            <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />}>
              Add bill
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
