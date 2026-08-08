// Fixed dd/MM/yyyy [HH:mm] formatting for every date/timestamp shown in the UI — deliberately not
// `.toLocaleDateString()`/`.toLocaleString()`, whose output shape depends on the browser's locale
// (12h vs 24h, mm/dd vs dd/mm, ...). See CLAUDE.md → "Date/time formatting" for why this is
// mandatory going forward, not just a one-off cleanup.

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// dd/MM/yyyy — for date-only fields (e.g. "Created", "Last updated").
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// dd/MM/yyyy HH:mm, 24-hour — for timestamps where the time also matters (log entries, notes,
// price history rows, ...).
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
