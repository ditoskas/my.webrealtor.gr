import type { Messages } from "./messages/types";

type TranslateParams = Record<string, string | number>;

function getByPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      source
    );
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

// Falls back to returning the raw key when a lookup misses, rather than throwing — a missing
// translation should surface as an obviously-wrong string in the UI, not crash the page.
export function translate(messages: Messages, key: string, params?: TranslateParams): string {
  const value = getByPath(messages, key);
  if (typeof value !== "string") return key;
  return interpolate(value, params);
}
