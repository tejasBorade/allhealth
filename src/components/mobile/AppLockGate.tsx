"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import { alpha } from "@mui/material/styles";
import { sidebarGradient } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { hasMpin, verifyMpin, clearMpin } from "@/lib/mobile/mpin";

const PIN_LENGTH = 6;
// How long the app can sit in the background before the next foreground
// re-triggers the lock screen — short enough to matter for a device left
// unattended, long enough not to re-prompt for a quick app-switch.
const RELOCK_AFTER_MS = 2 * 60 * 1000;

type Status = "checking" | "unlocked" | "locked";

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>("checking");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const backgroundedAtRef = React.useRef<number | null>(null);
  const verifying = pin.length >= PIN_LENGTH;

  React.useEffect(() => {
    let cancelled = false;

    async function checkLock() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setStatus("unlocked");
        return;
      }
      const locked = await hasMpin();
      if (!cancelled) setStatus(locked ? "locked" : "unlocked");
    }
    checkLock();

    let removeListener: (() => void) | undefined;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appStateChange", async ({ isActive }) => {
        if (!isActive) {
          backgroundedAtRef.current = Date.now();
          return;
        }
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (backgroundedAt && Date.now() - backgroundedAt > RELOCK_AFTER_MS) {
          const stillHasMpin = await hasMpin();
          if (stillHasMpin) setStatus("locked");
        }
      });
      removeListener = () => handle.remove();
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (verifying) return;
    setError(null);
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + digit));
  };

  const handleBackspace = () => {
    if (verifying) return;
    setPin((prev) => prev.slice(0, -1));
  };

  React.useEffect(() => {
    if (pin.length !== PIN_LENGTH || status !== "locked") return;
    let cancelled = false;
    verifyMpin(pin).then((ok) => {
      if (cancelled) return;
      if (ok) {
        setStatus("unlocked");
        setPin("");
      } else {
        setError("Incorrect PIN. Try again.");
        setPin("");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin, status]);

  const handleForgotPin = async () => {
    const supabase = createClient();
    await Promise.allSettled([supabase.auth.signOut(), clearMpin()]);
    window.location.href = "/login";
  };

  if (status !== "locked") {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: sidebarGradient,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Avatar sx={{ width: 56, height: 56, bgcolor: alpha("#ffffff", 0.14), mb: 2 }}>
        <FavoriteRoundedIcon sx={{ color: "#22D3EE" }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Enter your PIN
      </Typography>
      <Typography variant="body2" sx={{ color: alpha("#ffffff", 0.65), mb: 3 }}>
        FriendlyHealthy is locked
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, mb: 4 }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: `1.5px solid ${alpha("#ffffff", 0.5)}`,
              bgcolor: i < pin.length ? "#22D3EE" : "transparent",
              transition: "background-color 0.15s ease",
            }}
          />
        ))}
      </Box>

      <Typography
        variant="body2"
        sx={{ color: "#f87171", mb: 2, minHeight: 20, fontWeight: 600 }}
      >
        {error ?? " "}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 2, mb: 3 }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={verifying}
            sx={{
              height: 72,
              borderRadius: "50%",
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              bgcolor: alpha("#ffffff", 0.08),
              "&:hover": { bgcolor: alpha("#ffffff", 0.16) },
            }}
          >
            {digit}
          </Button>
        ))}
        <Box />
        <Button
          onClick={() => handleDigit("0")}
          disabled={verifying}
          sx={{
            height: 72,
            borderRadius: "50%",
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            bgcolor: alpha("#ffffff", 0.08),
            "&:hover": { bgcolor: alpha("#ffffff", 0.16) },
          }}
        >
          0
        </Button>
        <Button
          onClick={handleBackspace}
          disabled={verifying}
          sx={{ height: 72, borderRadius: "50%", color: alpha("#ffffff", 0.75) }}
        >
          <BackspaceRoundedIcon />
        </Button>
      </Box>

      <Button onClick={handleForgotPin} sx={{ color: alpha("#ffffff", 0.6), textTransform: "none" }}>
        Forgot PIN? Sign out
      </Button>
    </Box>
  );
}
