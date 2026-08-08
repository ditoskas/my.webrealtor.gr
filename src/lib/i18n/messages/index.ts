import type { Locale } from "../locales";
import type { Messages } from "./types";
import en from "./en";
import el from "./el";
import ru from "./ru";

export const MESSAGES: Record<Locale, Messages> = { en, el, ru };

export type { Messages };
