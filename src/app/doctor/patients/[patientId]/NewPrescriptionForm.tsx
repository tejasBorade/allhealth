"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import { theme } from "@/lib/theme";
import { createPrescription } from "./actions";

interface FormValues {
  diagnosis: string;
  followUpDate: string;
  notes: string;
  medicines: {
    medicationName: string;
    dosage: string;
    frequencyCode: string;
    durationDays: number;
  }[];
}

export default function NewPrescriptionForm({ patientId }: { patientId: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      diagnosis: "",
      followUpDate: "",
      notes: "",
      medicines: [{ medicationName: "", dosage: "", frequencyCode: "1-0-1", durationDays: 5 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(false);
    const result = await createPrescription(patientId, {
      diagnosis: values.diagnosis,
      followUpDate: values.followUpDate || null,
      notes: values.notes,
      medicines: values.medicines.map((m) => ({
        ...m,
        durationDays: Number(m.durationDays),
      })),
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    reset();
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          >
            <MedicationOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Write a prescription
          </Typography>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Prescription saved.
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField
              label="Diagnosis"
              placeholder="e.g. E11 — Type 2 Diabetes Mellitus"
              {...register("diagnosis")}
            />

            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
              >
                <TextField
                  label="Medication"
                  size="small"
                  required
                  {...register(`medicines.${index}.medicationName` as const, {
                    required: true,
                  })}
                />
                <TextField
                  label="Dosage"
                  size="small"
                  placeholder="e.g. 500mg"
                  required
                  {...register(`medicines.${index}.dosage` as const, { required: true })}
                />
                <TextField
                  label="Frequency"
                  size="small"
                  placeholder="e.g. 1-0-1, BD, TDS"
                  required
                  {...register(`medicines.${index}.frequencyCode` as const, {
                    required: true,
                  })}
                />
                <TextField
                  label="Duration (days)"
                  size="small"
                  type="number"
                  required
                  sx={{ width: 140 }}
                  {...register(`medicines.${index}.durationDays` as const, {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                  })}
                />
                <IconButton
                  aria-label="Remove medicine"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                append({ medicationName: "", dosage: "", frequencyCode: "1-0-1", durationDays: 5 })
              }
              sx={{ alignSelf: "start" }}
            >
              Add medicine
            </Button>

            <Divider />

            <TextField
              label="Follow-up / routine checkup date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 260 }}
              {...register("followUpDate")}
            />
            <TextField label="Notes" multiline minRows={2} {...register("notes")} />

            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: "start" }}>
              {isSubmitting ? "Saving..." : "Save prescription"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
