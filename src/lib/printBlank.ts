// A visible underscore blank for an empty field on a printed/PDF document — e.g. "Amount: ____",
// left for someone to fill in by hand — rather than a silent gap that looks like a mistake.
// Shared by ReceiptPage/ContractPage's printed output (see components/tools/*).
const BLANK = "____________________";

export function printValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : BLANK;
}
