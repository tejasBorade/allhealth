import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DoctorMessagesPage() {
  const { user } = await requireRole(["doctor"]);
  const supabase = await createClient();

  // No single UNION query via the JS client — merge the two relationship
  // sources (appointments, prescriptions) client-side instead.
  const [{ data: fromAppointments }, { data: fromPrescriptions }] = await Promise.all([
    supabase.from("appointments").select("patient_id").eq("doctor_id", user.id),
    supabase.from("prescriptions").select("patient_id").eq("doctor_id", user.id),
  ]);

  const patientIds = Array.from(
    new Set([
      ...(fromAppointments ?? []).map((row) => row.patient_id),
      ...(fromPrescriptions ?? []).map((row) => row.patient_id),
    ])
  );

  const { data: patients, error } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", patientIds)
      : { data: [], error: null };

  const conversations = await Promise.all(
    (patients ?? []).map(async (patient) => {
      const [{ data: lastMessages }, { count }] = await Promise.all([
        supabase
          .from("messages")
          .select("body, created_at, sender_id")
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${patient.id}),and(sender_id.eq.${patient.id},recipient_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("sender_id", patient.id)
          .is("read_at", null),
      ]);

      return {
        patientId: patient.id,
        fullName: patient.full_name,
        lastMessage: lastMessages?.[0] ?? null,
        unreadCount: count ?? 0,
      };
    })
  );

  conversations.sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
  });

  return (
    <>
      <PageHeader title="Messages" subtitle="Conversations with your patients." />

      {error && <Typography color="error">{error.message}</Typography>}

      <Paper variant="outlined">
        {conversations.length === 0 ? (
          <EmptyState
            icon={ChatBubbleOutlineOutlinedIcon}
            title="No patients yet"
            description="Patients you appoint or prescribe to will show up here."
          />
        ) : (
          <List>
            {conversations.map((conversation) => (
              <ListItemButton
                key={conversation.patientId}
                component="a"
                href={`/doctor/messages/${conversation.patientId}`}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>{initials(conversation.fullName)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={conversation.fullName ?? "Unnamed patient"}
                  secondary={
                    conversation.lastMessage ? (
                      <Box
                        component="span"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {conversation.lastMessage.sender_id === user.id ? "You: " : ""}
                        {conversation.lastMessage.body}
                      </Box>
                    ) : (
                      "No messages yet"
                    )
                  }
                  slotProps={{ secondary: { component: "span" } }}
                  sx={{ minWidth: 0, mr: 2 }}
                />
                <Stack sx={{ alignItems: "flex-end", flexShrink: 0, gap: 0.5 }}>
                  {conversation.lastMessage && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(conversation.lastMessage.created_at).toLocaleString()}
                    </Typography>
                  )}
                  {conversation.unreadCount > 0 && (
                    <Chip size="small" color="primary" label={conversation.unreadCount} />
                  )}
                </Stack>
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}
