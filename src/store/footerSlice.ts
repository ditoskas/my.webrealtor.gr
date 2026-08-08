import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FooterState, MessageStyle } from "@/lib/types";

const initialState: FooterState = {
  message: null,
};

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<{ text: string; style?: MessageStyle }>) {
      state.message = {
        text: action.payload.text,
        style: action.payload.style ?? "normal",
      };
    },
    setSuccess(state, action: PayloadAction<string>) {
      state.message = { text: action.payload, style: "success" };
    },
    setError(state, action: PayloadAction<string>) {
      state.message = { text: action.payload, style: "error" };
    },
    setWarning(state, action: PayloadAction<string>) {
      state.message = { text: action.payload, style: "warning" };
    },
    setInfo(state, action: PayloadAction<string>) {
      state.message = { text: action.payload, style: "info" };
    },
    clearMessage(state) {
      state.message = null;
    },
  },
});

export const { setMessage, setSuccess, setError, setWarning, setInfo, clearMessage } =
  footerSlice.actions;
export default footerSlice.reducer;
