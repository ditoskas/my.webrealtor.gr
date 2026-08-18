"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import type { ApiResponse, User } from "@/lib/types";
import Topbar from "./Topbar";
import Footer from "./Footer";
import styles from "./DashboardShell.module.scss";

// Pages that opt out of `.main`'s 80rem cap — Transactions (whose table needs the extra room for
// its Receipt/Contract file columns) and the Assets list (whose table has just as many columns:
// Kind/Type/Status/Category/Size/Location/Price/Owner/[Realtor]/Actions). Exact pathnames, not
// prefixes — `/assets/new`, `/assets/[id]`, `/assets/[id]/view`, `/assets/[id]/media` are
// form/detail layouts that read better width-capped, unlike the table-heavy list page. Add an
// entry here rather than hardcoding a one-off wrapper per page if another page needs this later.
const FULL_WIDTH_PATHS = new Set(["/transactions", "/assets"]);

export default function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isFullWidth = !!pathname && FULL_WIDTH_PATHS.has(pathname);

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
      <main className={`${styles.main} ${isFullWidth ? styles.mainFullWidth : ""}`}>{children}</main>
      <Footer />
    </div>
  );
}
