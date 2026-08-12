import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { theme } from "@/lib/theme";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import MessageComposer from "./MessageComposer";

export default async function PatientMessageThreadPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { user } = await requireRole(["patient"]);
  const { doctorId } = await params;

  const supabase = await createClient();

  // Mark incoming unread messages as read as a side effect of viewing the thread.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", doctorId)
    .is("read_at", null);

  const [{ data: profile }, { data: messages, error }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", doctorId).single(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${doctorId}),and(sender_id.eq.${doctorId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true }),
  ]);

  const doctorName = profile?.full_name ?? "Doctor";

  return (
    <>
      <PageHeader title={`Dr. ${doctorName}`} subtitle="Chat" />

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {(messages ?? []).length === 0 ? (
          <EmptyState
            icon={ChatBubbleOutlineRoundedIcon}
            title="No messages yet"
            description={`Say hello to Dr. ${doctorName} to start the conversation.`}
          />
        ) : (
          <Box sx={{ maxHeight: 480, overflowY: "auto", pr: 0.5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {(messages ?? []).map((message) => {
                const fromMe = message.sender_id === user.id;
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: "flex",
                      justifyContent: fromMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box sx={{ maxWidth: "70%" }}>
                      <Box
                        sx={{
                          px: 1.75,
                          py: 1,
                          borderRadius: 3,
                          bgcolor: fromMe ? "primary.main" : alpha(theme.palette.text.primary, 0.06),
                          color: fromMe ? "primary.contrastText" : "text.primary",
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {message.body}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mt: 0.25,
                          textAlign: fromMe ? "right" : "left",
                        }}
                      >
                        {new Date(message.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <MessageComposer recipientId={doctorId} />
      </Paper>
    </>
  );
}
