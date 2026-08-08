import type en from "./en";

// en.ts is the source of truth — every other locale's catalog must satisfy this exact shape,
// so a key added to en.ts without a matching key in el.ts/ru.ts is a compile error, not a
// silent runtime fallback.
export type Messages = typeof en;
