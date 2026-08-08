"use client";

import { useEffect, type ReactNode } from "react";
import apiClient from "@/lib/apiClient";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import type { ApiResponse, User } from "@/lib/types";
import Topbar from "./Topbar";
import Footer from "./Footer";
import styles from "./DashboardShell.module.scss";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Redux state doesn't survive a full page load — re-hydrate who's logged in from the
    // session cookie every time this shell mounts. proxy.ts already guarantees we only get
    // here when authenticated; this is purely to populate client-visible UI state (nav, role
    // checks), not a security boundary.
    apiClient
      .get<ApiResponse<User>>("/api/auth/me")
      .then((response) => {
        dispatch(setUser(response.data.data));
        dispatch(setLocale(response.data.data.language));
      })
      .catch(() => dispatch(clearUser()));
  }, [dispatch]);

  return (
    <div className={styles.shell}>
      <Topbar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
