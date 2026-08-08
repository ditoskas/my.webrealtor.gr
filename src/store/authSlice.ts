import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  // "loading" until the initial GET /api/auth/me (done by DashboardShell) resolves — lets
  // the UI avoid flashing the wrong nav items before we know who's logged in.
  status: "loading" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = {
  user: null,
  status: "loading",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    clearUser(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
