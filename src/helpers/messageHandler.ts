import { clearMessage, setMessage } from "@/store/footerSlice";
import type { AppDispatch } from "@/store";
import type { MessageStyle } from "@/lib/types";

/** Thin dispatch wrapper for the footer notification bar — see CLAUDE.md → Footer notifications. */
export class MessageHandler {
  private static show(dispatch: AppDispatch, text: string, style: MessageStyle) {
    dispatch(setMessage({ text, style }));
  }

  static success(dispatch: AppDispatch, text: string) {
    this.show(dispatch, text, "success");
  }

  static error(dispatch: AppDispatch, text: string) {
    this.show(dispatch, text, "error");
  }

  static info(dispatch: AppDispatch, text: string) {
    this.show(dispatch, text, "info");
  }

  static normal(dispatch: AppDispatch, text: string) {
    this.show(dispatch, text, "normal");
  }

  static warning(dispatch: AppDispatch, text: string) {
    this.show(dispatch, text, "warning");
  }

  static clear(dispatch: AppDispatch) {
    dispatch(clearMessage());
  }
}
