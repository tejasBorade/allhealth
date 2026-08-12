"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { sendMessage } from "./actions";

export default function MessageComposer({ recipientId }: { recipientId: string }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await sendMessage(recipientId, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <form ref={formRef} action={handleSubmit}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
          <TextField
            name="body"
            placeholder="Type a message…"
            required
            fullWidth
            multiline
            maxRows={4}
            autoComplete="off"
          />
          <IconButton type="submit" color="primary" disabled={pending} sx={{ mb: 0.25 }}>
            <SendRoundedIcon />
          </IconButton>
        </Box>
      </form>
    </Box>
  );
}
