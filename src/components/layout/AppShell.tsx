"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SearchIcon from "@mui/icons-material/Search";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EventIcon from "@mui/icons-material/Event";
import MedicationIcon from "@mui/icons-material/Medication";
import FolderIcon from "@mui/icons-material/Folder";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryIcon from "@mui/icons-material/History";
import ChatIcon from "@mui/icons-material/Chat";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { alpha } from "@mui/material/styles";
import { createClient } from "@/lib/supabase/client";
import { sidebarGradient } from "@/lib/theme";
import type { UserRole } from "@/lib/types";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/Footer";

const DRAWER_WIDTH = 264;
const ACCENT = "#22D3EE";

// Server Component layouts pass nav items as plain data (no component
// references) — a function reference can't cross the server/client
// boundary as a prop, so icons are resolved from this key here instead.
const NAV_ICONS = {
  dashboard: DashboardIcon,
  search: SearchIcon,
  event: EventIcon,
  medication: MedicationIcon,
  folder: FolderIcon,
  receipt: ReceiptIcon,
  people: PeopleIcon,
  uploadFile: UploadFileIcon,
  group: GroupIcon,
  person: PersonIcon,
  science: ScienceIcon,
  history: HistoryIcon,
  chat: ChatIcon,
  notifications: NotificationsIcon,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconKey;
}

const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  staff: "Staff",
  admin: "Admin",
};

function initialsFrom(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function AppShell({
  title,
  navItems,
  userName,
  userId,
  role,
  children,
}: {
  title: string;
  navItems: NavItem[];
  userName?: string | null;
  userId?: string;
  role?: UserRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [patientSearch, setPatientSearch] = React.useState("");

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .then(({ count }) => {
        if (!cancelled) setUnreadCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
    // Re-checks whenever the route changes, so the badge reflects reads
    // that happened on the notifications page without needing realtime.
  }, [userId, pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handlePatientSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/doctor/patients?q=${encodeURIComponent(patientSearch)}`);
  };

  const sidebarContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: sidebarGradient,
        color: "#fff",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.5, py: 2.75 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha("#ffffff", 0.14),
          }}
        >
          <FavoriteRoundedIcon sx={{ fontSize: 20, color: ACCENT }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.2 }}>
          FriendlyHealthy
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, px: 1.5, py: 1 }}>
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 0.5,
                color: active ? "#fff" : alpha("#ffffff", 0.68),
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: -12,
                  top: "20%",
                  height: "60%",
                  width: 3,
                  borderRadius: 3,
                  bgcolor: ACCENT,
                  opacity: active ? 1 : 0,
                  transition: "opacity 0.15s ease",
                },
                "&.Mui-selected": {
                  bgcolor: alpha("#ffffff", 0.12),
                },
                "&.Mui-selected:hover": {
                  bgcolor: alpha("#ffffff", 0.16),
                },
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.08),
                  color: "#fff",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
                <Icon fontSize="small" sx={{ color: active ? ACCENT : "inherit" }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 700 : 500 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, pb: 2.5, pt: 1.5 }}>
        <Divider sx={{ borderColor: alpha("#ffffff", 0.14), mb: 1.5 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
              bgcolor: alpha(ACCENT, 0.22),
              color: ACCENT,
            }}
          >
            {initialsFrom(userName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700 }}>
              {userName ?? "Account"}
            </Typography>
            {role && (
              <Chip
                label={ROLE_LABEL[role]}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10.5,
                  fontWeight: 700,
                  bgcolor: alpha(ACCENT, 0.18),
                  color: ACCENT,
                }}
              />
            )}
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "10px",
            color: alpha("#ffffff", 0.75),
            "&:hover": { bgcolor: alpha("#ffffff", 0.08), color: "#fff" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 600 } } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { sm: "none" } }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
          {role === "doctor" && (
            <Box
              component="form"
              onSubmit={handlePatientSearchSubmit}
              sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1, maxWidth: 360 }}
            >
              <TextField
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search patients..."
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Notifications">
              <IconButton
                component={Link}
                href={role ? `/${role}/notifications` : "#"}
                aria-label="Notifications"
              >
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  <NotificationsRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Log out">
              <IconButton
                onClick={handleLogout}
                aria-label="Log out"
                sx={{ display: { xs: "inline-flex", sm: "none" } }}
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" },
          }}
        >
          {sidebarContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none" },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3.5 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children}
        <Footer sx={{ mt: 5, pt: 2.5, borderTop: 1, borderColor: "divider", color: "text.secondary" }} />
      </Box>

      {role === "patient" && <ChatWidget />}
    </Box>
  );
}
