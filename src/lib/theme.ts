import { createTheme, alpha } from "@mui/material/styles";

// SymptoTrack-reference palette: teal/cyan primary gradient, dark-navy
// sidebar, violet used only for condition tags — see index.html for the
// source design reference this was matched against.
const teal = {
  50: "#E0F2FE",
  100: "#BAE6FD",
  500: "#0EA5E9",
  600: "#0891B2",
  700: "#0369A1",
  900: "#0C4A6E",
};
const navy = { 950: "#0B1220", 900: "#0F172A" };
const violetAccent = "#7C3AED";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: teal[600],
      light: teal[500],
      dark: teal[700],
      contrastText: "#ffffff",
    },
    secondary: {
      main: violetAccent,
      light: "#A78BFA",
      dark: "#5B21B6",
      contrastText: "#ffffff",
    },
    success: { main: "#059669", light: "#ECFDF5", dark: "#047857" },
    warning: { main: "#D97706", light: "#FFFBEB", dark: "#92400E" },
    error: { main: "#E11D48", light: "#FFF1F2", dark: "#9F1239" },
    info: { main: "#2563EB", light: "#EFF6FF", dark: "#1D4ED8" },
    background: {
      default: "#F0F4F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
    },
    divider: "#E2E8F0",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    h1: { fontFamily: "var(--font-heading)", fontWeight: 800 },
    h2: { fontFamily: "var(--font-heading)", fontWeight: 800 },
    h3: { fontFamily: "var(--font-heading)", fontWeight: 800, letterSpacing: -0.5 },
    h4: { fontFamily: "var(--font-heading)", fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontFamily: "var(--font-heading)", fontWeight: 700 },
    h6: { fontFamily: "var(--font-heading)", fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F0F4F8",
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
          boxShadow: `0 8px 20px -8px ${alpha(teal[600], 0.55)}`,
          "&:hover": {
            boxShadow: `0 10px 24px -6px ${alpha(teal[600], 0.6)}`,
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
        outlined: { borderColor: "#E2E8F0" },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
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
          borderRadius: 16,
          border: "1px solid #E2E8F0",
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
          color: "#475569",
          backgroundColor: teal[50],
          borderBottom: "1px solid #E2E8F0",
        },
        root: {
          borderBottom: "1px solid #EDF2F7",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-of-type td": { borderBottom: "none" },
          "&:hover": { backgroundColor: alpha(teal[500], 0.05) },
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

export const brandGradient = `linear-gradient(135deg, ${teal[600]} 0%, ${teal[700]} 100%)`;
export const sidebarGradient = `linear-gradient(180deg, ${navy[950]} 0%, ${navy[900]} 100%)`;
