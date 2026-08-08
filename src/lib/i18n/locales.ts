export type Locale = "en" | "el" | "ru";

// Plain array of values (vs. LOCALE_OPTIONS' value+label pairs) — used wherever only the values
// matter, e.g. models/User.ts's `language` field enum, mirroring USER_ROLES/GENDERS in lib/types.ts.
export const LOCALES: Locale[] = ["en", "el", "ru"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "webrealtor_locale";

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "el", label: "Ελληνικά" },
  { value: "ru", label: "Русский" },
];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "el" || value === "ru";
}
