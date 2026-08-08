import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import footerReducer from "./footerSlice";
import localeReducer from "./localeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    footer: footerReducer,
    locale: localeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
