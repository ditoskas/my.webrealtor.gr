import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/locales";

interface LocaleState {
  locale: Locale;
}

const initialState: LocaleState = {
  locale: DEFAULT_LOCALE,
};

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCALE_STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
