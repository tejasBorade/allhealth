import { createTheme, alpha } from "@mui/material/styles";

// Modern vibrant SaaS palette: violet primary, pink secondary, cyan accent
// for the dark sidebar's active-nav state (see AppShell.tsx).
const violet = {
  50: "#F5F3FF",
  100: "#EDE9FE",
  400: "#A78BFA",
  500: "#8B5CF6",
  600: "#7C3AED",
  700: "#6D28D9",
  900: "#4C1D95",
  950: "#2E1065",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: violet[700],
      light: violet[500],
      dark: violet[900],
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#EC4899",
      light: "#F472B6",
      dark: "#DB2777",
      contrastText: "#ffffff",
    },
    success: { main: "#10B981", light: "#D1FAE5", dark: "#047857" },
    warning: { main: "#F59E0B", light: "#FEF3C7", dark: "#B45309" },
    error: { main: "#F43F5E", light: "#FFE4E6", dark: "#BE123C" },
    info: { main: "#0EA5E9", light: "#E0F2FE", dark: "#0369A1" },
    background: {
      default: "#F7F6FD",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1E1B2E",
      secondary: "#6B7280",
    },
    divider: alpha(violet[700], 0.1),
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    h3: { fontWeight: 800, letterSpacing: -0.5 },
    h4: { fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F7F6FD",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          paddingBlock: 9,
        },
        contained: {
          boxShadow: `0 8px 20px -8px ${alpha(violet[700], 0.55)}`,
          "&:hover": {
            boxShadow: `0 10px 24px -6px ${alpha(violet[700], 0.6)}`,
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: alpha(violet[700], 0.12) },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${alpha(violet[700], 0.08)}`,
          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 999 },
        outlined: { borderWidth: 1.5 },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${alpha(violet[700], 0.08)}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          textTransform: "uppercase",
          fontSize: "0.7rem",
          letterSpacing: 0.5,
          color: "#6B7280",
          backgroundColor: violet[50],
          borderBottom: `1px solid ${alpha(violet[700], 0.1)}`,
        },
        root: {
          borderBottom: `1px solid ${alpha(violet[700], 0.06)}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-of-type td": { borderBottom: "none" },
          "&:hover": { backgroundColor: alpha(violet[500], 0.04) },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
  },
});

export const brandGradient = `linear-gradient(135deg, ${violet[600]} 0%, #DB2777 100%)`;
export const sidebarGradient = `linear-gradient(180deg, ${violet[950]} 0%, ${violet[900]} 55%, ${violet[700]} 100%)`;
