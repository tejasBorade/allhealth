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
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import { theme } from "@/lib/theme";
import { useToast } from "@/components/providers/ToastProvider";
import { createPrescription } from "./actions";

const ICD10_SUGGESTIONS = [
  "E11.9 - Type 2 Diabetes Mellitus, without complications",
  "I10 - Essential (Primary) Hypertension",
  "J45.909 - Asthma, unspecified",
  "E78.5 - Hyperlipidemia, unspecified",
  "M54.5 - Low back pain",
  "J06.9 - Acute upper respiratory infection, unspecified",
  "K21.9 - Gastro-esophageal reflux disease without esophagitis",
  "N39.0 - Urinary tract infection, site not specified",
  "E03.9 - Hypothyroidism, unspecified",
  "M25.50 - Pain in unspecified joint",
  "J02.9 - Acute pharyngitis, unspecified",
  "I25.10 - Atherosclerotic heart disease of native coronary artery",
  "F41.9 - Anxiety disorder, unspecified",
  "L20.9 - Atopic dermatitis, unspecified",
  "G43.909 - Migraine, unspecified, not intractable",
];

const MEDICINE_SUGGESTIONS = [
  "Metformin",
  "Glimepiride",
  "Atorvastatin",
  "Amlodipine",
  "Telmisartan",
  "Losartan",
  "Levothyroxine",
  "Montelukast",
  "Azithromycin",
  "Paracetamol",
  "Pantoprazole",
  "Cetirizine",
];

const FREQUENCY_CHIPS: { label: string; code: string }[] = [
  { label: "Once daily", code: "OD" },
  { label: "Twice daily", code: "BD" },
  { label: "Thrice daily", code: "TDS" },
  { label: "At bedtime", code: "HS" },
  { label: "As needed", code: "SOS" },
];

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
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      toast(result.error, "error");
      return;
    }
    setSuccess(true);
    toast("Prescription saved.", "success");
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
              slotProps={{ htmlInput: { list: "icd10-suggestions" } }}
              {...register("diagnosis")}
            />

            {fields.map((field, index) => {
              const currentFrequencyCode = watch(`medicines.${index}.frequencyCode`);
              return (
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
                    slotProps={{ htmlInput: { list: "medicine-suggestions" } }}
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
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <TextField
                      label="Frequency"
                      size="small"
                      placeholder="e.g. 1-0-1, BD, TDS"
                      required
                      {...register(`medicines.${index}.frequencyCode` as const, {
                        required: true,
                      })}
                    />
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                      {FREQUENCY_CHIPS.map((chip) => {
                        const isActive = currentFrequencyCode === chip.code;
                        return (
                          <Chip
                            key={chip.code}
                            label={chip.label}
                            size="small"
                            clickable
                            variant={isActive ? "filled" : "outlined"}
                            color={isActive ? "primary" : "default"}
                            onClick={() =>
                              setValue(`medicines.${index}.frequencyCode` as const, chip.code, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        );
                      })}
                    </Stack>
                  </Box>
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
              );
            })}
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
        <datalist id="icd10-suggestions">
          {ICD10_SUGGESTIONS.map((entry) => (
            <option key={entry} value={entry} />
          ))}
        </datalist>
        <datalist id="medicine-suggestions">
          {MEDICINE_SUGGESTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </CardContent>
    </Card>
  );
}
