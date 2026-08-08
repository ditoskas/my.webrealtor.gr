"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setLocale } from "@/store/localeSlice";
import { LOCALE_STORAGE_KEY, isLocale } from "@/lib/i18n/locales";

// Rendered once, app-wide, inside Providers — not colocated in DashboardShell, because the login
// page (outside the (dashboard) route group DashboardShell wraps) needs the persisted locale just
// as much as the dashboard does. The locale slice starts at DEFAULT_LOCALE on every fresh page
// load (localStorage isn't available at module-eval time for the server-rendered first paint), so
// the last choice (persisted by localeSlice's setLocale) has to be re-applied here.
export default function LocaleHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocale(stored)) dispatch(setLocale(stored));
  }, [dispatch]);

  return null;
}
