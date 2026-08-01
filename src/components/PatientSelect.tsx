"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export interface PatientOption {
  id: string;
  full_name: string | null;
}

export default function PatientSelect({
  patients,
  name,
  label = "Patient",
}: {
  patients: PatientOption[];
  name: string;
  label?: string;
}) {
  const [value, setValue] = React.useState<PatientOption | null>(null);

  return (
    <>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <Autocomplete
        options={patients}
        getOptionLabel={(option) => option.full_name ?? "Unnamed patient"}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        renderInput={(params) => <TextField {...params} label={label} size="small" required />}
        sx={{ minWidth: 260 }}
      />
    </>
  );
}
