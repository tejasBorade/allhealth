import Link from "next/link";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { alpha } from "@mui/material/styles";
import { theme } from "@/lib/theme";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { markRead, markAllRead } from "./actions";

export default async function StaffNotificationsPage() {
  const { user } = await requireRole(["staff"]);

  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.read_at);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Updates about appointments, reports, and billing."
        action={
          hasUnread ? (
            <form action={markAllRead}>
              <Button
                type="submit"
                variant="outlined"
                startIcon={<DoneAllRoundedIcon fontSize="small" />}
              >
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />

      {error && <Typography color="error">{error.message}</Typography>}

      <Stack spacing={1.5}>
        {(notifications ?? []).length === 0 && (
          <EmptyState
            icon={NotificationsNoneRoundedIcon}
            title="No notifications yet"
            description="Updates about clinic activity will show up here."
          />
        )}
        {(notifications ?? []).map((n) => {
          const isUnread = !n.read_at;
          const titleEl = (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: isUnread ? 700 : 500,
                color: "text.primary",
              }}
            >
              {n.title}
            </Typography>
          );
          return (
            <Card
              key={n.id}
              variant="outlined"
              sx={{
                borderLeft: isUnread
                  ? `4px solid ${theme.palette.primary.main}`
                  : "4px solid transparent",
                bgcolor: isUnread ? alpha(theme.palette.primary.main, 0.05) : "background.paper",
                opacity: isUnread ? 1 : 0.7,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  {n.link ? (
                    <Link href={n.link} style={{ textDecoration: "none" }}>
                      {titleEl}
                    </Link>
                  ) : (
                    titleEl
                  )}
                  {n.body && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {n.body}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {new Date(n.created_at).toLocaleString()}
                  </Typography>
                </Box>
                {isUnread && (
                  <form action={markRead.bind(null, n.id)}>
                    <IconButton type="submit" size="small" color="primary" aria-label="Mark as read">
                      <CheckRoundedIcon fontSize="small" />
                    </IconButton>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
