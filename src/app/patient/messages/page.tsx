import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

function initials(name?: string | null) {
  if (!name) return "Dr";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "Dr";
}

function truncate(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

interface DoctorConversation {
  doctorId: string;
  doctorName: string;
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
  unreadCount: number;
}

export default async function PatientMessagesPage() {
  const { user } = await requireRole(["patient"]);
  const supabase = await createClient();

  // No single UNION query via the JS client — merge the two relationship
  // sources (appointments, prescriptions) client-side instead.
  const [{ data: fromAppointments }, { data: fromPrescriptions }] = await Promise.all([
    supabase.from("appointments").select("doctor_id").eq("patient_id", user.id),
    supabase.from("prescriptions").select("doctor_id").eq("patient_id", user.id),
  ]);

  const doctorIds = Array.from(
    new Set([
      ...(fromAppointments ?? []).map((row) => row.doctor_id),
      ...(fromPrescriptions ?? []).map((row) => row.doctor_id),
    ])
  );

  const conversations: DoctorConversation[] = await Promise.all(
    doctorIds.map(async (doctorId) => {
      const [{ data: profile }, { data: lastMessage }, { count: unreadCount }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", doctorId).single(),
        supabase
          .from("messages")
          .select("body, created_at, sender_id")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${doctorId}),and(sender_id.eq.${doctorId},recipient_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", doctorId)
          .is("read_at", null),
      ]);

      return {
        doctorId,
        doctorName: profile?.full_name ?? "Unknown",
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              createdAt: lastMessage.created_at,
              fromMe: lastMessage.sender_id === user.id,
            }
          : null,
        unreadCount: unreadCount ?? 0,
      };
    })
  );

  conversations.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <>
      <PageHeader title="Messages" subtitle="Chat with your doctors." />

      <Paper variant="outlined">
        {conversations.length === 0 ? (
          <EmptyState
            icon={ChatBubbleOutlineRoundedIcon}
            title="No conversations yet"
            description="Book an appointment or get a prescription to start messaging your doctor."
          />
        ) : (
          <List disablePadding>
            {conversations.map((conversation) => (
              <ListItemButton
                key={conversation.doctorId}
                component="a"
                href={`/patient/messages/${conversation.doctorId}`}
                sx={{ py: 1.5 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>{initials(conversation.doctorName)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Dr. {conversation.doctorName}
                      </Typography>
                      {conversation.unreadCount > 0 && (
                        <Chip
                          label={conversation.unreadCount}
                          size="small"
                          color="primary"
                          sx={{ height: 20, minWidth: 20, fontSize: "0.7rem" }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    conversation.lastMessage ? (
                      <Box component="span" sx={{ display: "block" }}>
                        {conversation.lastMessage.fromMe ? "You: " : ""}
                        {truncate(conversation.lastMessage.body)}
                      </Box>
                    ) : (
                      "No messages yet"
                    )
                  }
                />
                {conversation.lastMessage && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 2 }}>
                    {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                  </Typography>
                )}
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}
