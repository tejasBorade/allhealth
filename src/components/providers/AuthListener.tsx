"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppDispatch } from "@/store/hooks";
import { setSession, clearSession } from "@/store/authSlice";
import type { UserRole } from "@/lib/types";

// Mirrors the Supabase session into Redux for client components that need
// the current user/role without prop-drilling. Server-side route gating
// (requireRole) is the real security boundary — this is UX state only.
export default function AuthListener() {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const supabase = createClient();

    const syncProfile = async (userId: string, email: string | null) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, approved")
        .eq("id", userId)
        .single();

      const typed = profile as {
        role?: UserRole;
        full_name?: string | null;
        approved?: boolean;
      } | null;

      if (!typed?.role) {
        dispatch(clearSession());
        return;
      }

      dispatch(
        setSession({
          userId,
          email: email ?? "",
          role: typed.role,
          fullName: typed.full_name ?? null,
          approved: !!typed.approved,
        })
      );
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) syncProfile(user.id, user.email ?? null);
      else dispatch(clearSession());
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) syncProfile(session.user.id, session.user.email ?? null);
      else dispatch(clearSession());
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return null;
}
