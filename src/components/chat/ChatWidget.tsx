"use client";

import * as React from "react";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";

interface ChatLink {
  label: string;
  url: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  links?: ChatLink[];
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you find a doctor, book or cancel an appointment, or pull up your prescriptions, " +
    "reports, and billing status. What do you need?",
};

export default function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || pending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.status === 503) {
        setUnavailable(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "AI chat isn't configured yet — please check back later." },
        ]);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? "Something went wrong. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, links: data.links }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Couldn't reach the assistant — please try again." },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 96,
            left: 24,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 140px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: "16px",
            overflow: "hidden",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              FriendlyHealthy Assistant
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "inherit" }} aria-label="Close chat">
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box ref={listRef} sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1.5 }}>
            <Stack spacing={1.25}>
              {messages.map((message, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: "12px",
                      bgcolor: message.role === "user" ? "primary.main" : alpha(theme.palette.primary.main, 0.08),
                      color: message.role === "user" ? "primary.contrastText" : "text.primary",
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </Typography>
                  </Box>
                  {message.links && message.links.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                      {message.links.map((link, j) => (
                        <Button
                          key={j}
                          size="small"
                          variant="outlined"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                          sx={{ justifyContent: "space-between", textTransform: "none" }}
                        >
                          {link.label}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
              {pending && (
                <Box sx={{ alignSelf: "flex-start", px: 1.5, py: 1 }}>
                  <CircularProgress size={18} />
                </Box>
              )}
            </Stack>
          </Box>

          <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1}>
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={unavailable ? "AI chat isn't configured yet" : "Ask me anything..."}
                size="small"
                fullWidth
                disabled={pending || unavailable}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={pending || unavailable || !input.trim()}
                aria-label="Send"
              >
                <SendRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      )}

      <Fab
        color="primary"
        onClick={() => setOpen((v) => !v)}
        sx={{ position: "fixed", bottom: 24, left: 24, zIndex: 1300 }}
        aria-label="Chat with the assistant"
      >
        {open ? <CloseRoundedIcon /> : <ChatBubbleRoundedIcon />}
      </Fab>
    </>
  );
}
