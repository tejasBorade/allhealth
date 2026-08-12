"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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
    <Stack sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <form ref={formRef} action={handleSubmit}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end" }}>
          <TextField
            name="body"
            placeholder="Type a message..."
            required
            fullWidth
            multiline
            maxRows={4}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            endIcon={<SendRoundedIcon fontSize="small" />}
          >
            {pending ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
