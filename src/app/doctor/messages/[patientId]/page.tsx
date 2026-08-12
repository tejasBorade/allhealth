import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import PageHeader from "@/components/PageHeader";
import { theme } from "@/lib/theme";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import MessageComposer from "./MessageComposer";

export default async function DoctorMessageThreadPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { user } = await requireRole(["doctor"]);
  const { patientId } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", patientId)
    .single();

  // Mark incoming unread messages as read before rendering the thread.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("sender_id", patientId)
    .is("read_at", null);

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${patientId}),and(sender_id.eq.${patientId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader title={profile?.full_name ?? "Patient"} subtitle="Chat" />

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
          {(messages ?? []).length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No messages yet. Say hello!
            </Typography>
          ) : (
            (messages ?? []).map((message) => {
              const isMine = message.sender_id === user.id;
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "70%",
                      borderRadius: 3,
                      px: 1.75,
                      py: 1,
                      bgcolor: isMine ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.06),
                      color: isMine ? theme.palette.primary.contrastText : theme.palette.text.primary,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {message.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        textAlign: "right",
                        color: isMine ? alpha(theme.palette.primary.contrastText, 0.75) : "text.secondary",
                      }}
                    >
                      {new Date(message.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        <MessageComposer recipientId={patientId} />
      </Paper>
    </>
  );
}
