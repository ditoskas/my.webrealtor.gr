import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";
import { MESSAGES } from "@/lib/i18n/messages";
import { translate } from "@/lib/i18n/translate";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useCurrentUser = () => useAppSelector((state) => state.auth.user);

/** Root and Administrator can mutate; Operator is view-only. See CLAUDE.md → Auth. */
export const useCanEdit = () => {
  const user = useCurrentUser();
  return user?.role !== "Operator";
};

export const useLocale = () => useAppSelector((state) => state.locale.locale);

/** `t("realtors.table.empty")`, or `t("realtors.countMessage", { count })` for interpolation. */
export const useTranslation = () => {
  const locale = useLocale();
  const messages = MESSAGES[locale];
  return useCallback(
    (key: string, params?: Record<string, string | number>) => translate(messages, key, params),
    [messages]
  );
};
