"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import { theme } from "@/lib/theme";

export type ToastType = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ShowToast = (message: string, type?: ToastType) => void;

const ToastContext = React.createContext<ShowToast>(() => {});

/** Global toast trigger — call from any Client Component: `toast("Saved", "success")`. */
export function useToast(): ShowToast {
  return React.useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ElementType> = {
  info: InfoRoundedIcon,
  success: CheckCircleRoundedIcon,
  warning: WarningAmberRoundedIcon,
  error: ErrorRoundedIcon,
};

const COLORS: Record<ToastType, string> = {
  info: theme.palette.primary.main,
  success: theme.palette.success.main,
  warning: theme.palette.warning.main,
  error: theme.palette.error.main,
};

let idCounter = 0;
const AUTO_DISMISS_MS = 3800;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback<ShowToast>(
    (message, type = "info") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          maxWidth: 380,
        }}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <Box
              key={t.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.2,
                minWidth: 280,
                bgcolor: "background.paper",
                borderRadius: "10px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
                borderLeft: `4px solid ${COLORS[t.type]}`,
                px: 2,
                py: 1.5,
                animation: "toast-in 0.2s ease",
                "@keyframes toast-in": {
                  from: { opacity: 0, transform: "translateY(8px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <Icon sx={{ color: COLORS[t.type], fontSize: 20, mt: 0.2 }} />
              <Typography variant="body2" sx={{ flexGrow: 1, pt: 0.1 }}>
                {t.message}
              </Typography>
              <IconButton size="small" onClick={() => dismiss(t.id)} sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    </ToastContext.Provider>
  );
}
