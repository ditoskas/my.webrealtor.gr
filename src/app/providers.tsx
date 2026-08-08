"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import LocaleHydrator from "./LocaleHydrator";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <LocaleHydrator />
      {children}
    </Provider>
  );
}
