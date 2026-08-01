import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "@/lib/types";

export type { UserRole };

export interface AuthState {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  fullName: string | null;
  approved: boolean;
  status: "loading" | "signed-out" | "signed-in";
}

const initialState: AuthState = {
  userId: null,
  email: null,
  role: null,
  fullName: null,
  approved: false,
  status: "loading",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{
        userId: string;
        email: string;
        role: UserRole;
        fullName: string | null;
        approved: boolean;
      }>
    ) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.fullName = action.payload.fullName;
      state.approved = action.payload.approved;
      state.status = "signed-in";
    },
    clearSession(state) {
      state.userId = null;
      state.email = null;
      state.role = null;
      state.fullName = null;
      state.approved = false;
      state.status = "signed-out";
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
